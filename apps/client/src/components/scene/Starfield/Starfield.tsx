import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, type Points } from 'three'
import { brand } from '../../../styles/brand'
import { useScene } from '../../../stores/useScene'

/**
 * A deep, drifting field of brand-tinted points that fills the space the camera
 * descends through. Gives the scene atmosphere and parallax depth so the
 * background reads as an intentional void with substance — not empty black.
 * Points fade with distance (sizeAttenuation) and a few are bright enough to
 * catch the bloom pass.
 *
 * Every visual/motion knob is a prop with the tuned default, so the field can be
 * dialed in by changing a number.
 */
export interface StarfieldProps {
  /** Number of points. */
  count?: number
  /** Point size (world units, with size attenuation). */
  size?: number
  /** Base material opacity. */
  opacity?: number
  /** Field extent on X / Y / Z. */
  spreadX?: number
  spreadY?: number
  spreadZ?: number
  /** Slow auto-rotation speed (rad/s). */
  driftSpeed?: number
  /** Pointer parallax strength on X / Y. */
  parallaxX?: number
  parallaxY?: number
  /** Fraction of points that are "hot" (extra-bright, catch the bloom). */
  hotFraction?: number
  /** Brightness multiplier for hot vs. ordinary points. */
  hotIntensity?: number
  dimIntensity?: number
  /** PRNG seed — change to reshuffle the field deterministically. */
  seed?: number
}

/** Deterministic PRNG (mulberry32) so the field is stable across renders — the
 *  React Compiler requires render to be pure, so no Math.random here. */
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function Starfield({
  count = 520,
  size = 0.07,
  opacity = 0.9,
  spreadX = 38,
  spreadY = 44,
  spreadZ = 26,
  driftSpeed = 0.01,
  parallaxX = 0.8,
  parallaxY = 0.5,
  hotFraction = 0.12,
  hotIntensity = 1.8,
  dimIntensity = 0.55,
  seed = 0x1a7e5,
}: StarfieldProps) {
  const ref = useRef<Points>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)

  const { positions, colors } = useMemo(() => {
    const rng = makeRng(seed)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = [
      new Color(brand.violet),
      new Color(brand.violetSoft),
      new Color(brand.cyan),
      new Color(brand.lavender),
    ]
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (rng() - 0.5) * spreadX
      positions[i * 3 + 1] = (rng() - 0.5) * spreadY - 8
      positions[i * 3 + 2] = -rng() * spreadZ - 1
      const c = palette[(rng() * palette.length) | 0]
      const hot = rng() < hotFraction ? hotIntensity : dimIntensity
      colors[i * 3 + 0] = c.r * hot
      colors[i * 3 + 1] = c.g * hot
      colors[i * 3 + 2] = c.b * hot
    }
    return { positions, colors }
  }, [count, spreadX, spreadY, spreadZ, hotFraction, hotIntensity, dimIntensity, seed])

  useFrame((state, delta) => {
    const p = ref.current
    if (!p || reducedMotion) return
    p.rotation.y += delta * driftSpeed
    p.position.x += (-state.pointer.x * parallaxX - p.position.x) * Math.min(1, delta * 2)
    p.position.y += (-state.pointer.y * parallaxY - p.position.y) * Math.min(1, delta * 2)
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
