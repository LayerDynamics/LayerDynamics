import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll, useGLTF, Text } from '@react-three/drei'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  MathUtils,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type Points,
  ShaderMaterial,
} from 'three'
import { SCENE, PROCESS } from './layout'
import { useScene } from '../stores/useScene'
import { brand } from '../styles/brand'
import { buildProcessAttributes, prepareLogoGeometry } from './processGeometry'

const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'
const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

/** The real product geometry: the LayerDynamics logo (a 17-body CAD solid). */
const LOGO_URL = '/assets/objects/LayerDynamicsLogo.glb'

/** Client-facing caption per pipeline stage, in scroll order. The copy is
 *  deliberately honest about what each stage actually computes (the segmentation
 *  is feature-space k-means over position+normal; the decimation is vertex
 *  clustering) — no dressed-up ML claims. */
const STAGES = [
  { kicker: '01 / 05', title: 'SOLID → SURFACE MESH' },
  { kicker: '02 / 05', title: 'POINT-CLOUD SAMPLING' },
  { kicker: '03 / 05', title: 'NORMAL & SPATIAL SEGMENTATION' },
  { kicker: '04 / 05', title: 'VERTEX-CLUSTER DECIMATION' },
  { kicker: '05 / 05', title: 'VARIATION & GENERATION' },
] as const

const VERTEX = /* glsl */ `
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

const FRAGMENT = /* glsl */ `
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

/**
 * The mesh-processing showcase: a single point system that scrubs through the
 * pipeline as the user scrolls the PROCESS band — Solid → Surface mesh →
 * Point-cloud sampling → Normal/spatial segmentation → Vertex-cluster decimation
 * → Variation & generation. The section self-holds in front of the camera while
 * the band is active (position derived from scroll offset via the same lerp the
 * CameraRig uses), then releases at the band edges so it scrolls past naturally.
 *
 * The source mesh is a procedural placeholder (see createSourceGeometry); swap
 * that one function for a loaded Blender/GLB mesh and everything here carries
 * over unchanged.
 */
export default function MeshProcessing() {
  const scroll = useScroll()
  const contactY = useScene((s) => s.contactY)
  const reducedMotion = useScene((s) => s.reducedMotion)

  const holdRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)
  const pointsRef = useRef<Points>(null)
  const solidRef = useRef<Mesh>(null)
  const wireRef = useRef<Mesh>(null)

  const [stage, setStage] = useState(0)
  const stageRef = useRef(0)

  // Load the real logo mesh, merge/normalize it, then sample + precompute every
  // per-point attribute the pipeline needs. Built once (Suspense gates render
  // until the GLB is ready — the scene Loader covers the wait).
  const gltf = useGLTF(LOGO_URL)
  const source = useMemo(() => prepareLogoGeometry(gltf.scene), [gltf.scene])
  const attrs = useMemo(() => buildProcessAttributes(source), [source])

  // The point cloud geometry: position is the sampled surface; the rest are the
  // morph targets / per-point data the shader reads.
  const pointGeo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(attrs.surface, 3))
    g.setAttribute('aDecimated', new BufferAttribute(attrs.decimated, 3))
    g.setAttribute('aVariation', new BufferAttribute(attrs.variation, 3))
    g.setAttribute('aSegColor', new BufferAttribute(attrs.segColor, 3))
    g.setAttribute('aRandom', new BufferAttribute(attrs.random, 1))
    // Generous bounding sphere so the shader-morphed points are never culled.
    g.computeBoundingSphere()
    if (g.boundingSphere) g.boundingSphere.radius = attrs.radius + 1.5
    return g
  }, [attrs])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uSeg: { value: 0 },
          uDecimate: { value: 0 },
          uVary: { value: 0 },
          uAppear: { value: 0 },
          uSize: { value: 0.95 },
          uPixelRatio: { value: Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1) },
          uMono: { value: new Color('#5b5690') },
        },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
      }),
    [],
  )

  // Dispose GPU resources on unmount.
  useEffect(() => {
    return () => {
      pointGeo.dispose()
      material.dispose()
      source.dispose()
    }
  }, [pointGeo, material, source])

  useFrame((state) => {
    const offset = scroll.offset
    const { bandStart, bandEnd } = PROCESS
    const band = bandEnd - bandStart
    // Local progress through the band, 0..1.
    const p = MathUtils.clamp((offset - bandStart) / band, 0, 1)

    // --- self-hold: keep the section framed while the band is active ---
    // Clamp the offset to the band, then evaluate the SAME lerp CameraRig uses.
    // Inside the band the held Y tracks the camera (parked feel); outside, it
    // pins to the band edge so the camera scrolls past it to/from hero/grid.
    if (holdRef.current) {
      const clamped = MathUtils.clamp(offset, bandStart, bandEnd)
      holdRef.current.position.y = MathUtils.lerp(SCENE.cameraTopY, contactY, clamped)
    }

    // --- stage drivers (smoothstep windows over band progress p) ---
    const solidOpacity = 1 - MathUtils.smoothstep(p, 0.02, 0.13)
    const wireOpacity =
      MathUtils.smoothstep(p, 0.05, 0.13) * (1 - MathUtils.smoothstep(p, 0.22, 0.32))
    const appear = MathUtils.smoothstep(p, 0.1, 0.34)
    const seg = MathUtils.smoothstep(p, 0.34, 0.5)
    const decimate = MathUtils.smoothstep(p, 0.52, 0.68)
    const vary = MathUtils.smoothstep(p, 0.74, 0.94)

    material.uniforms.uAppear.value = appear
    material.uniforms.uSeg.value = seg
    material.uniforms.uDecimate.value = decimate
    material.uniforms.uVary.value = vary

    if (solidRef.current) {
      const m = solidRef.current.material as MeshStandardMaterial
      m.opacity = solidOpacity
      solidRef.current.visible = solidOpacity > 0.01
    }
    if (wireRef.current) {
      const m = wireRef.current.material as MeshBasicMaterial
      m.opacity = wireOpacity * 0.32
      wireRef.current.visible = wireOpacity > 0.01
    }

    // The logo is a flat plaque — a full spin would flash it edge-on, so give
    // it only a subtle face-on tilt for parallax/life. Off for reduced-motion.
    if (spinRef.current) {
      if (reducedMotion) {
        spinRef.current.rotation.set(0, 0, 0)
      } else {
        const t = state.clock.elapsedTime
        spinRef.current.rotation.y = Math.sin(t * 0.35) * 0.32
        spinRef.current.rotation.x = Math.sin(t * 0.27) * 0.1
      }
    }

    // Active caption: derive a discrete stage index and only re-render on change.
    const idx = p < 0.18 ? 0 : p < 0.34 ? 1 : p < 0.52 ? 2 : p < 0.74 ? 3 : 4
    if (idx !== stageRef.current) {
      stageRef.current = idx
      setStage(idx)
    }
  })

  // Mono color for the pre-segmentation solid/points.
  const violet = useMemo(() => new Color(brand.violet), [])

  return (
    <group ref={holdRef} position={[0, SCENE.collectionY, 0]}>
      <group ref={spinRef} position={[0, 0, 1.5]} scale={0.82}>
        <points ref={pointsRef} geometry={pointGeo} material={material} frustumCulled={false} />

        {/* Solid input: the smooth shaded source mesh that dissolves into the
            wireframe surface mesh, then the point cloud. */}
        <mesh ref={solidRef} geometry={source} frustumCulled={false}>
          <meshStandardMaterial
            color={violet}
            emissive={violet}
            emissiveIntensity={0.15}
            roughness={0.5}
            metalness={0.3}
            transparent
            opacity={1}
          />
        </mesh>

        {/* Surface mesh: wireframe reveal between solid and points. */}
        <mesh ref={wireRef} geometry={source} frustumCulled={false}>
          <meshBasicMaterial color={brand.cyan} wireframe transparent opacity={0} />
        </mesh>
      </group>

      {/* Section heading + active-stage caption. Children of the held group, so
          they stay framed with the geometry as it tracks the camera. */}
      <Text
        font={FONT_MED}
        position={[0, 2.55, 0]}
        fontSize={0.16}
        color={brand.cyan}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.36}
      >
        MESH PROCESSING
      </Text>

      <Text
        font={FONT_MED}
        position={[0, -2.35, 0]}
        fontSize={0.13}
        color="#6f6884"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.3}
      >
        {STAGES[stage].kicker}
      </Text>

      <Text
        font={FONT_BOLD}
        position={[0, -2.75, 0]}
        fontSize={0.34}
        color={brand.lavender}
        anchorX="center"
        anchorY="middle"
        maxWidth={9}
        textAlign="center"
        letterSpacing={0.01}
      >
        {STAGES[stage].title}
      </Text>
    </group>
  )
}

// Warm the GLB cache so the logo is ready by the time the band scrolls in.
useGLTF.preload(LOGO_URL)
