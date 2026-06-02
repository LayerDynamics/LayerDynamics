import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Color, MathUtils, type Group } from 'three'
import { brand } from '../../../styles/brand'
import { useScene } from '../../../stores/useScene'

/**
 * The hero focal object: a tower of stacked glass slabs that twist into a slow
 * helix — "layered dynamics" made literal and three-dimensional. Each slab is a
 * dark, glassy rounded slab capped by a thin, bright emissive bar that grades
 * `colorBottom` → `colorTop` up the stack; those bright bars are the bloom
 * sources, so the whole monolith reads as a lit, layered crystal.
 *
 * Every shape/motion/material knob is a prop with the tuned default, so the
 * monolith can be redialed by changing numbers.
 */
export interface LogoSpinProps {
  /** Uniform scale of the whole tower. */
  scale?: number
  /** Number of stacked slabs. */
  slabCount?: number
  /** Total vertical height of the tower. */
  span?: number
  /** Helical twist (× π) from bottom to top slab. */
  twist?: number
  /** Auto-spin speed (rad/s). */
  spinSpeed?: number
  /** Amplitude / speed of the gentle X-axis wobble. */
  wobbleAmount?: number
  wobbleSpeed?: number
  /** Slab footprint before taper. */
  baseWidth?: number
  baseDepth?: number
  /** Slab thickness (Y). */
  slabThickness?: number
  /** How much the mid slabs bulge vs. the ends (0 = no taper). */
  taperAmount?: number
  /** Emissive intensity of the bright accent bar (the bloom source). */
  glowIntensity?: number
  /** Emissive intensity of the glass body. */
  bodyEmissive?: number
  /** Glass body opacity. */
  opacity?: number
  /** Accent-bar gradient endpoints (bottom → top of the stack). */
  colorBottom?: string
  colorTop?: string
}

interface Slab {
  y: number
  rot: number
  width: number
  depth: number
  glow: string
}

interface SlabParams {
  slabCount: number
  span: number
  twist: number
  baseWidth: number
  baseDepth: number
  taperAmount: number
  colorBottom: string
  colorTop: string
}

function buildSlabs(p: SlabParams): Slab[] {
  const slabs: Slab[] = []
  const cBottom = new Color(p.colorBottom)
  const cTop = new Color(p.colorTop)
  for (let i = 0; i < p.slabCount; i++) {
    const t = p.slabCount > 1 ? i / (p.slabCount - 1) : 0.5 // 0 (bottom) → 1 (top)
    const taper = 1 - Math.pow(Math.abs(t - 0.5) * 2, 1.7) * p.taperAmount
    slabs.push({
      y: (t - 0.5) * p.span,
      rot: (t - 0.5) * Math.PI * p.twist,
      width: p.baseWidth * taper,
      depth: p.baseDepth * taper,
      glow: '#' + cBottom.clone().lerp(cTop, t).getHexString(),
    })
  }
  return slabs
}

export default function LogoSpin({
  scale = 1,
  slabCount = 9,
  span = 3.2,
  twist = 0.12,
  spinSpeed = 0.22,
  wobbleAmount = 0.06,
  wobbleSpeed = 0.3,
  baseWidth = 2.7,
  baseDepth = 1.6,
  slabThickness = 0.16,
  taperAmount = 0.34,
  glowIntensity = 3.4,
  bodyEmissive = 0.25,
  opacity = 0.92,
  colorBottom = brand.violetDeep,
  colorTop = brand.cyan,
}: LogoSpinProps) {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const slabs = useMemo(
    () => buildSlabs({ slabCount, span, twist, baseWidth, baseDepth, taperAmount, colorBottom, colorTop }),
    [slabCount, span, twist, baseWidth, baseDepth, taperAmount, colorBottom, colorTop],
  )

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    if (reducedMotion) {
      g.rotation.y = -0.4
      return
    }
    g.rotation.y += delta * spinSpeed
    g.rotation.x = MathUtils.damp(
      g.rotation.x,
      Math.sin(state.clock.elapsedTime * wobbleSpeed) * wobbleAmount,
      3,
      delta,
    )
  })

  // The accent bar sits just above each slab's top face.
  const barY = slabThickness / 2 + 0.03

  return (
    <group ref={group} scale={scale}>
      {slabs.map((s, i) => (
        <group key={i} position={[0, s.y, 0]} rotation={[0, s.rot, 0]}>
          <RoundedBox args={[s.width, slabThickness, s.depth]} radius={0.07} smoothness={4} castShadow>
            <meshPhysicalMaterial
              color={brand.bg2}
              metalness={0.4}
              roughness={0.22}
              clearcoat={1}
              clearcoatRoughness={0.25}
              transparent
              opacity={opacity}
              emissive={s.glow}
              emissiveIntensity={bodyEmissive}
            />
          </RoundedBox>

          <mesh position={[0, barY, 0]}>
            <boxGeometry args={[s.width * 0.96, 0.022, s.depth * 0.96]} />
            <meshStandardMaterial color={s.glow} emissive={s.glow} emissiveIntensity={glowIntensity} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
