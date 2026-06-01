import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll, useGLTF } from '@react-three/drei'
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
import { SCENE, PROCESS } from '../lib/layout'
import { useScene } from '../../../stores/useScene'
import { brand } from '../../../styles/brand'
import { buildProcessAttributes, prepareLogoGeometry } from '../lib/processGeometry'
import { VERTEX, FRAGMENT } from './shaders'
import { LOGO_URL } from './constants'
import MeshProcessingLayout from './MeshProcessingLayout'

/**
 * Mesh-processing logic: loads + samples the logo, builds the point geometry +
 * shader material, and every frame derives the pipeline progress from scroll to
 * drive the shader uniforms, the solid/wireframe opacities, the self-hold, the
 * face-on tilt, and the active caption. Hands geometry/material/refs to the
 * presentational layout.
 */
export default function MeshProcessingContainer() {
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

    // --- self-hold: keep the object exactly centered while the band guides ---
    // While grabbed (inside the band) pin the object to the camera's ACTUAL eye
    // level so it sits exactly halfway up the viewport every frame — not the
    // camera's *target* Y, which the frame-damped camera trails, leaving the
    // object drifting off-center mid-scroll. Outside the band, rest at the
    // band-edge world Y (derived from the same lerp the camera uses) so the
    // object rises into the center on the way in and scrolls away on the way out.
    if (holdRef.current) {
      if (offset <= bandStart) {
        holdRef.current.position.y = MathUtils.lerp(SCENE.cameraTopY, contactY, bandStart)
      } else if (offset >= bandEnd) {
        holdRef.current.position.y = MathUtils.lerp(SCENE.cameraTopY, contactY, bandEnd)
      } else {
        holdRef.current.position.y = state.camera.position.y
      }
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
    <MeshProcessingLayout
      holdRef={holdRef}
      spinRef={spinRef}
      pointsRef={pointsRef}
      solidRef={solidRef}
      wireRef={wireRef}
      pointGeo={pointGeo}
      material={material}
      source={source}
      violet={violet}
      stage={stage}
    />
  )
}

// Warm the GLB cache so the logo is ready by the time the band scrolls in.
useGLTF.preload(LOGO_URL)
