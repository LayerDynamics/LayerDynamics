// Point-cloud shaders for the mesh-processing showcase. The vertex shader morphs
// each sampled point surface → decimated → variation and stages a cascading
// reveal; the fragment shader draws a crisp alpha-composited dot.

export const VERTEX = /* glsl */ `
  uniform float uSeg;
  uniform float uDecimate;
  uniform float uVary;
  uniform float uAppear;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uMono;

  attribute vec3 aDecimated;
  attribute vec3 aVariation;
  attribute vec3 aSegColor;
  attribute float aRandom;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // position == sampled surface point. Morph: surface → decimated → variation.
    vec3 p = position;
    p = mix(p, aDecimated, uDecimate);
    p = mix(p, aVariation, uVary);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Distance-attenuated point size; points swell slightly as they become a
    // generated variant so the final stage reads as denser, "grown" geometry.
    float size = uSize * (1.0 + 0.7 * uVary);
    gl_PointSize = size * uPixelRatio * (300.0 / -mv.z);

    vColor = mix(uMono, aSegColor, uSeg);

    // Staggered reveal: each point fades in as uAppear passes its own threshold,
    // so the cloud cascades into existence during sampling instead of snapping.
    vAlpha = smoothstep(aRandom, aRandom + 0.25, uAppear);
  }
`

export const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    // Crisp dot (slim anti-aliased edge) so a dense cloud still reads as the
    // logo's silhouette instead of blurring into a blob under bloom.
    float soft = smoothstep(0.5, 0.36, d);
    // Alpha-composited (not additive): density reads as depth without the whole
    // cloud summing to a white wall under bloom.
    gl_FragColor = vec4(vColor, vAlpha * soft * 0.9);
  }
`
