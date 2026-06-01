import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { useScrollRange } from '../../../hooks/useScrollRange'
import { useScene } from '../../../stores/useScene'
import HeroLayout from './HeroLayout'

/**
 * Hero logic: rises and recedes slightly as the camera scrolls past it
 * (scroll-range reveal, frame-damped). Owns the animated group ref and the
 * frame loop; hands the ref to the presentational HeroLayout.
 */
export default function HeroContainer() {
  const inner = useRef<Group>(null)
  const exit = useScrollRange(0, 0.16)
  const reducedMotion = useScene((s) => s.reducedMotion)

  useFrame((_, delta) => {
    const g = inner.current
    if (!g) return
    const p = exit.current
    if (reducedMotion) {
      g.position.y = 0
      g.scale.setScalar(1)
      return
    }
    g.position.y = MathUtils.damp(g.position.y, p * 1.6, 5, delta)
    g.scale.setScalar(MathUtils.damp(g.scale.x, 1 - p * 0.08, 5, delta))
  })

  return <HeroLayout innerRef={inner} />
}
