import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Color, MathUtils, type Group } from 'three'
import { brand } from '../styles/brand'
import { useScene } from '../stores/useScene'

/**
 * The hero focal object: a tower of stacked glass slabs that twist into a slow
 * helix — "layered dynamics" made literal and three-dimensional. Each slab is a
 * dark, glassy rounded slab capped by a thin, bright emissive bar that grades
 * violet → cyan up the stack; those bright bars are the bloom sources, so the
 * whole monolith reads as a lit, layered crystal rather than a flat glyph.
 */
const SLAB_COUNT = 9
const violet = new Color(brand.violetDeep)
const cyan = new Color(brand.cyan)

interface Slab {
  y: number
  rot: number
  width: number
  depth: number
  glow: string
}

function buildSlabs(): Slab[] {
  const slabs: Slab[] = []
  const span = 3.2 // total vertical height of the tower
  for (let i = 0; i < SLAB_COUNT; i++) {
    const t = i / (SLAB_COUNT - 1) // 0 (bottom) → 1 (top)
    // Gentle barrel taper: widest in the middle, narrower at the ends, so the
    // stack reads as one cohesive crystal rather than a pile of equal plates.
    const taper = 1 - Math.pow(Math.abs(t - 0.5) * 2, 1.7) * 0.34
    slabs.push({
      y: (t - 0.5) * span,
      // Barely-there twist: just enough that the stacked faces catch the rim
      // lights differently as the whole object turns, without looking jagged.
      rot: (t - 0.5) * Math.PI * 0.12,
      width: 2.7 * taper,
      depth: 1.6 * taper,
      glow: '#' + violet.clone().lerp(cyan, t).getHexString(),
    })
  }
  return slabs
}

export default function LogoSpin({ scale = 1 }: { scale?: number }) {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const slabs = useMemo(() => buildSlabs(), [])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    if (reducedMotion) {
      g.rotation.y = -0.4
      return
    }
    g.rotation.y += delta * 0.22
    // Gentle breathing tilt so the helix catches the lights as it turns.
    g.rotation.x = MathUtils.damp(g.rotation.x, Math.sin(state.clock.elapsedTime * 0.3) * 0.06, 3, delta)
  })

  return (
    <group ref={group} scale={scale}>
      {slabs.map((s, i) => (
        <group key={i} position={[0, s.y, 0]} rotation={[0, s.rot, 0]}>
          {/* The glass slab body. */}
          <RoundedBox args={[s.width, 0.16, s.depth]} radius={0.07} smoothness={4} castShadow>
            <meshPhysicalMaterial
              color={brand.bg2}
              metalness={0.4}
              roughness={0.22}
              clearcoat={1}
              clearcoatRoughness={0.25}
              transparent
              opacity={0.92}
              emissive={s.glow}
              emissiveIntensity={0.25}
            />
          </RoundedBox>

          {/* Thin bright cap bar — the bloom source for this layer. */}
          <mesh position={[0, 0.11, 0]}>
            <boxGeometry args={[s.width * 0.96, 0.022, s.depth * 0.96]} />
            <meshStandardMaterial
              color={s.glow}
              emissive={s.glow}
              emissiveIntensity={3.4}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
