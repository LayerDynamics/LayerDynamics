import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
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
import { useScene } from '../../../stores/useScene'
import { scrollProgress } from '../../../stores/levelScroll'
import { brand } from '../../../styles/brand'
import { buildProcessAttributes, prepareLogoGeometry } from '../lib/processGeometry'
import { VERTEX, FRAGMENT } from '../MeshProcessing/shaders'
import { LOGO_URL } from '../MeshProcessing/constants'
import MeshProcessingLayout from '../MeshProcessing/MeshProcessingLayout'

/**
 * 3D Processing level: the logo runs the Solid→Surface→Point-cloud→Segmentation→
 * Decimation→Variation pipeline, scrubbed by the level's own 0→1 progress (no
 * global ScrollControls, no self-hold — the level is framed by LevelCamera, so
 * the object simply sits at the origin and the stages scrub in place).
 */
export default function ProcessingLevel() {
  const reducedMotion = useScene((s) => s.reducedMotion)

  const spinRef = useRef<Group>(null)
  const holdRef = useRef<Group>(null)
  const pointsRef = useRef<Points>(null)
  const solidRef = useRef<Mesh>(null)
  const wireRef = useRef<Mesh>(null)

  const [stage, setStage] = useState(0)
  const stageRef = useRef(0)

  const gltf = useGLTF(LOGO_URL)
  const source = useMemo(() => prepareLogoGeometry(gltf.scene), [gltf.scene])
  const attrs = useMemo(() => buildProcessAttributes(source), [source])

  const pointGeo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(attrs.surface, 3))
    g.setAttribute('aDecimated', new BufferAttribute(attrs.decimated, 3))
    g.setAttribute('aVariation', new BufferAttribute(attrs.variation, 3))
    g.setAttribute('aSegColor', new BufferAttribute(attrs.segColor, 3))
    g.setAttribute('aRandom', new BufferAttribute(attrs.random, 1))
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

  useEffect(() => {
    return () => {
      pointGeo.dispose()
      material.dispose()
      source.dispose()
    }
  }, [pointGeo, material, source])

  useFrame((state) => {
    const p = MathUtils.clamp(scrollProgress.current, 0, 1)

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

    if (spinRef.current) {
      if (reducedMotion) {
        spinRef.current.rotation.set(0, 0, 0)
      } else {
        const t = state.clock.elapsedTime
        spinRef.current.rotation.y = Math.sin(t * 0.35) * 0.32
        spinRef.current.rotation.x = Math.sin(t * 0.27) * 0.1
      }
    }

    const idx = p < 0.18 ? 0 : p < 0.34 ? 1 : p < 0.52 ? 2 : p < 0.74 ? 3 : 4
    if (idx !== stageRef.current) {
      stageRef.current = idx
      setStage(idx)
    }
  })

  const violet = useMemo(() => new Color(brand.violet), [])

  return (
    <group position={[0, 12, 0]}>
      {/* MeshProcessingLayout parks its hold group at SCENE.collectionY (−12);
          lift the whole level back to the origin so LevelCamera frames it. */}
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
    </group>
  )
}

useGLTF.preload(LOGO_URL)
