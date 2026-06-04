import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Text } from '@react-three/drei'
import { Color, Group, MathUtils, Mesh, MeshStandardMaterial } from 'three'
import type { LanguageDef, LanguageId } from '../../../data/languages'
import { langColor } from '../../../styles/brand'

const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

interface Props {
  lang: LanguageDef
  position: [number, number, number]
  /** World size the logo's max planar dimension is scaled to. */
  size: number
  /** Called with the language id when clicked. Wired to navigation by the level. */
  onSelect?: (id: LanguageId) => void
}

/**
 * One brand-colored, extruded tech-logo GLB on the Languages level. The GLBs were
 * exported with a neutral material precisely so the brand color is applied here at
 * runtime (material override). Hovering brightens the emissive and scales it up
 * (frame-damped — no spring lib, matching the scene's `MathUtils.damp` convention).
 * Clicking calls `onSelect(id)`; navigation is the level/DOM's job — NO router hooks
 * inside the Canvas.
 */
export default function LanguageLogo({ lang, position, size, onSelect }: Props) {
  const group = useRef<Group>(null)
  const [hover, setHover] = useState(false)
  const { scene } = useGLTF(lang.glb)
  const col = langColor[lang.id]

  const { object, material } = useMemo(() => {
    const material = new MeshStandardMaterial({
      color: new Color(col.base),
      emissive: new Color(col.accent),
      emissiveIntensity: 0.15,
      metalness: 0.35,
      roughness: 0.4,
    })
    const object = scene.clone(true)
    object.traverse((o) => {
      if ((o as Mesh).isMesh) (o as Mesh).material = material
    })
    return { object, material }
  }, [scene, col.base, col.accent])

  // Pointer affordance — restore the cursor on leave/unmount so it never sticks.
  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hover])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const target = hover ? size * 1.12 : size
    const s = MathUtils.damp(g.scale.x, target, 9, dt)
    g.scale.setScalar(s)
    material.emissiveIntensity = MathUtils.damp(
      material.emissiveIntensity,
      hover ? 0.55 : 0.15,
      9,
      dt,
    )
  })

  return (
    <group
      ref={group}
      position={position}
      scale={size}
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(lang.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
      }}
      onPointerOut={() => setHover(false)}
    >
      <primitive object={object} />
      {/* Label sits below the logo (local space — scales with the group). */}
      <Text
        font={FONT_MED}
        position={[0, -0.66, 0.18]}
        fontSize={0.15}
        color={col.base}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.04}
        outlineWidth={0.004}
        outlineColor={col.accent}
      >
        {lang.label}
      </Text>
    </group>
  )
}
