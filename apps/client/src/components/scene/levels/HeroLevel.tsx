import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import HeroLayout from '../Hero/HeroLayout'
import { scrollProgress } from '../../../stores/levelScroll'
import { useLevels } from '../../../stores/useLevels'

/**
 * Hero level: the layered-glass monolith + name. Framed at the origin. As the
 * visitor scrolls (in-level progress 0→1) the hero rises and recedes slightly,
 * signalling departure; at the end LevelInput arms the transition. Advance mode,
 * so progress is only a reveal cue, not a scrub.
 */
export default function HeroLevel() {
  const inner = useRef<Group>(null)
  const reducedMotion = useLevels((s) => s.reducedMotion)

  useFrame((_, delta) => {
    const g = inner.current
    if (!g) return
    if (reducedMotion) {
      g.position.y = 0
      g.scale.setScalar(1)
      return
    }
    const p = scrollProgress.current
    g.position.y = MathUtils.damp(g.position.y, p * 1.6, 5, delta)
    g.scale.setScalar(MathUtils.damp(g.scale.x, 1 - p * 0.08, 5, delta))
  })

  return <HeroLayout innerRef={inner} />
}
