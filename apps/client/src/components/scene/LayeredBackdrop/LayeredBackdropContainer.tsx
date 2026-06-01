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

/**
 * Backdrop logic: builds the glow texture and applies pointer parallax to the
 * whole backdrop group each frame. Hands both to the presentational layout.
 */
export default function LayeredBackdropContainer() {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const glow = useRadialGlow(brand.violet)

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
    g.position.x = MathUtils.damp(g.position.x, -px * 1.2, 3, delta)
    g.position.y = MathUtils.damp(g.position.y, -py * 0.7, 3, delta)
    g.rotation.y = MathUtils.damp(g.rotation.y, px * 0.04, 3, delta)
  })

  return <LayeredBackdropLayout groupRef={group} glow={glow} />
}
