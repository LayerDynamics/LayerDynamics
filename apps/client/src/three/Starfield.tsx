import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, type Points } from 'three'
import { brand } from '../styles/brand'
import { useScene } from '../stores/useScene'

/**
 * A deep, drifting field of brand-tinted points that fills the space the camera
 * descends through. Gives the scene atmosphere and parallax depth so the
 * background reads as an intentional void with substance — not empty black.
 * Points fade with distance (sizeAttenuation) and a few are bright enough to
 * catch the bloom pass.
 */
const COUNT = 520

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

export default function Starfield() {
  const ref = useRef<Points>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)

  const { positions, colors } = useMemo(() => {
    const rng = makeRng(0x1a7e5)
    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const palette = [
      new Color(brand.violet),
      new Color(brand.violetSoft),
      new Color(brand.cyan),
      new Color(brand.lavender),
    ]
    for (let i = 0; i < COUNT; i++) {
      // Wide horizontal spread, tall vertical column matching the scroll depth,
      // pushed mostly behind the content (negative-ish z, receding).
      positions[i * 3 + 0] = (rng() - 0.5) * 38
      positions[i * 3 + 1] = (rng() - 0.5) * 44 - 8
      positions[i * 3 + 2] = -rng() * 26 - 1
      const c = palette[(rng() * palette.length) | 0]
      // A few hot points (brighter) so bloom has sparkles to grab.
      const hot = rng() < 0.12 ? 1.8 : 0.55
      colors[i * 3 + 0] = c.r * hot
      colors[i * 3 + 1] = c.g * hot
      colors[i * 3 + 2] = c.b * hot
    }
    return { positions, colors }
  }, [])

  useFrame((state, delta) => {
    const p = ref.current
    if (!p || reducedMotion) return
    // Slow drift + gentle pointer parallax.
    p.rotation.y += delta * 0.01
    p.position.x += ((-state.pointer.x * 0.8) - p.position.x) * Math.min(1, delta * 2)
    p.position.y += ((-state.pointer.y * 0.5) - p.position.y) * Math.min(1, delta * 2)
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
