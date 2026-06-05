import type { IUniform, WebGLProgramParametersWithUniforms } from 'three'

/**
 * Marker comments injected into each stage. GLSL comments survive into the compiled
 * program source, so a real-WebGL test can assert these are present to prove the
 * `onBeforeCompile` string injection actually took (a wrong chunk token would make
 * `String.replace` silently no-op and the effect would never appear).
 */
export const ER_VERTEX_MARKER = '// ER_DISSOLVE_VERTEX'
export const ER_FRAGMENT_MARKER = '// ER_DISSOLVE_FRAGMENT'

/** Per-injection-site fingerprints — each maps to one chunk token replacement. */
export const ER_VERTEX_NORMAL_SITE = 'objectNormal = erRotate(objectNormal'
export const ER_VERTEX_TRANSFORM_SITE = 'transformed = aCentroid + erRel + erFly;'
export const ER_FRAGMENT_DISCARD_SITE = 'if (vErLocal >= 0.999) discard;'
export const ER_FRAGMENT_EMISSIVE_SITE = 'totalEmissiveRadiance += uEdgeColor * uEdgeStrength'

/** Classic Ashima/Gustavson simplex 3D noise — drives the spatial erosion front. */
const SIMPLEX_3D = /* glsl */ `
vec4 erPermute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 erTaylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float erSnoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = erPermute(erPermute(erPermute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = erTaylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`

/** Rodrigues rotation — tumbles each flake about its scatter axis as it flies. */
const ROTATE = /* glsl */ `
vec3 erRotate(vec3 v, vec3 axis, float angle){
  float c = cos(angle);
  float s = sin(angle);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}
`

const VERT_PARS = /* glsl */ `
${ER_VERTEX_MARKER}
attribute vec3 aScatter;
attribute vec3 aCentroid;
attribute float aSeed;
uniform float uProgress;
uniform float uTime;
uniform float uScatter;
uniform float uNoiseScale;
uniform float uEdgeWidth;
uniform float uSpin;
uniform float uGravity;
varying float vErLocal;
${SIMPLEX_3D}
${ROTATE}
`

// Runs at <beginnormal_vertex> (before the normal is transformed for lighting). We
// compute the per-flake dissolve amount `erLocal` here and rotate the lighting normal
// so a tumbling flake stays correctly lit. erLocal/erAxis/erAng are plain main()-scope
// locals, reused by the <begin_vertex> block below.
const VERT_NORMAL = /* glsl */ `#include <beginnormal_vertex>
  float erN = erSnoise(aCentroid * uNoiseScale) * 0.5 + 0.5;
  float erThresh = mix(erN, aSeed, 0.35);
  float erLocal = clamp(smoothstep(erThresh, erThresh + max(uEdgeWidth, 1e-4), uProgress), 0.0, 1.0);
  vErLocal = erLocal;
  vec3 erAxis = normalize(aScatter + vec3(1e-5));
  float erAng = erLocal * uSpin + uTime * erLocal;
  objectNormal = erRotate(objectNormal, erAxis, erAng);
  #ifdef USE_TANGENT
  objectTangent = erRotate(objectTangent, erAxis, erAng);
  #endif
`

// Runs at <begin_vertex>: spin the flake about its own centroid, then launch it along
// its scatter direction with a little downward gravity arc as it accelerates.
const VERT_TRANSFORM = /* glsl */ `#include <begin_vertex>
  vec3 erRel = erRotate(transformed - aCentroid, erAxis, erAng);
  vec3 erFly = aScatter * (erLocal * uScatter);
  erFly.y -= uGravity * erLocal * erLocal;
  transformed = aCentroid + erRel + erFly;
`

const FRAG_PARS = /* glsl */ `
${ER_FRAGMENT_MARKER}
uniform vec3 uEdgeColor;
uniform float uEdgeStrength;
varying float vErLocal;
`

// Fully-scattered flakes are gone — discard them.
const FRAG_DISCARD = /* glsl */ `#include <clipping_planes_fragment>
  if (vErLocal >= 0.999) discard;
`

// Burning-edge glow: emissive peaks while the flake is mid-release (vErLocal ~ 0.5),
// fading to nothing when intact or gone. Added to the lit emissive so it reads as heat.
const FRAG_EMISSIVE = /* glsl */ `#include <emissivemap_fragment>
  totalEmissiveRadiance += uEdgeColor * uEdgeStrength * (4.0 * vErLocal * (1.0 - vErLocal));
`

export interface ErosionUniforms {
  uProgress: IUniform<number>
  uTime: IUniform<number>
  uScatter: IUniform<number>
  uNoiseScale: IUniform<number>
  uEdgeWidth: IUniform<number>
  uSpin: IUniform<number>
  uGravity: IUniform<number>
  uEdgeColor: IUniform
  uEdgeStrength: IUniform<number>
}

/**
 * Patch a MeshStandardMaterial's compiled shader with the erosion effect and bind the
 * given uniform objects. Throws if any expected chunk token is absent (a three.js
 * version drift) instead of silently producing a dead, un-dissolving material.
 */
export function injectErosion(
  shader: WebGLProgramParametersWithUniforms,
  uniforms: ErosionUniforms,
): void {
  Object.assign(shader.uniforms, uniforms)

  shader.vertexShader = replaceOrThrow(
    replaceOrThrow(
      replaceOrThrow(
        shader.vertexShader,
        '#include <common>',
        '#include <common>\n' + VERT_PARS,
        'vertex <common>',
      ),
      '#include <beginnormal_vertex>',
      VERT_NORMAL,
      'vertex <beginnormal_vertex>',
    ),
    '#include <begin_vertex>',
    VERT_TRANSFORM,
    'vertex <begin_vertex>',
  )

  shader.fragmentShader = replaceOrThrow(
    replaceOrThrow(
      replaceOrThrow(
        shader.fragmentShader,
        '#include <common>',
        '#include <common>\n' + FRAG_PARS,
        'fragment <common>',
      ),
      '#include <clipping_planes_fragment>',
      FRAG_DISCARD,
      'fragment <clipping_planes_fragment>',
    ),
    '#include <emissivemap_fragment>',
    FRAG_EMISSIVE,
    'fragment <emissivemap_fragment>',
  )
}

function replaceOrThrow(source: string, token: string, replacement: string, site: string): string {
  if (!source.includes(token)) {
    throw new Error(
      `ErosionMaterial: expected shader token "${token}" at ${site} was not found — ` +
        `the three.js MeshStandardMaterial chunk layout has changed and the dissolve ` +
        `injection would be a no-op. Update erosion.glsl.ts for this three version.`,
    )
  }
  return source.replace(token, replacement)
}
