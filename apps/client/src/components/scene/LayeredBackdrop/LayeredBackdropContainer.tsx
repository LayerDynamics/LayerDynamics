import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, MathUtils, type Group } from 'three'
import { brand } from '../../../styles/brand'
import { useScene } from '../../../stores/useScene'
import LayeredBackdropLayout from './LayeredBackdropLayout'

/** Builds a radial-gradient texture (bright center → transparent edge) used for
 *  the soft hero glow plane. */
function useRadialGlow(hex: string) {
  return useMemo(() => {
    const size = 256
    const cv = document.createElement('canvas')
    cv.width = cv.height = size
    const ctx = cv.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, hex)
    g.addColorStop(0.45, hex + '66')
    g.addColorStop(1, hex + '00')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    return new CanvasTexture(cv)
  }, [hex])
}

export interface LayeredBackdropContainerProps {
  /** Pointer parallax shift of the whole backdrop on X / Y. */
  parallaxX?: number
  parallaxY?: number
  /** Pointer-driven yaw of the backdrop. */
  rotateAmount?: number
  /** Frame-damping rate of the parallax (higher = snappier). */
  dampRate?: number
  /** Hue of the radial hero glow. */
  glowColor?: string
  /** Glow plane opacity / size (passed to the layout). */
  glowOpacity?: number
  glowSize?: number
}

/**
 * Backdrop logic: builds the glow texture and applies pointer parallax to the
 * whole backdrop group each frame. Parallax strengths, damping, and the glow
 * appearance are props (tuned defaults). Hands both to the presentational layout.
 */
export default function LayeredBackdropContainer({
  parallaxX = 1.2,
  parallaxY = 0.7,
  rotateAmount = 0.04,
  dampRate = 3,
  glowColor = brand.violet,
  // Background is pure black (with the starfield) — the additive coral halo is
  // bloom-amplified into a wash, so it's switched off. The Starfield + parallax
  // remain; the coral accent comes from the subjects, not a backdrop glow.
  glowOpacity = 0,
  glowSize = 19,
}: LayeredBackdropContainerProps) {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const glow = useRadialGlow(glowColor)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    if (reducedMotion) {
      g.position.x = 0
      g.rotation.y = 0
      return
    }
    const px = state.pointer.x
    const py = state.pointer.y
    g.position.x = MathUtils.damp(g.position.x, -px * parallaxX, dampRate, delta)
    g.position.y = MathUtils.damp(g.position.y, -py * parallaxY, dampRate, delta)
    g.rotation.y = MathUtils.damp(g.rotation.y, px * rotateAmount, dampRate, delta)
  })

  return (
    <LayeredBackdropLayout
      groupRef={group}
      glow={glow}
      glowOpacity={glowOpacity}
      glowSize={glowSize}
    />
  )
}
