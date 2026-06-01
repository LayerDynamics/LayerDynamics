import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Tier } from '../../../data/projects'
import { tierColor } from '../../../styles/brand'
import { useScene } from '../../../stores/useScene'
import ProjectAccentLayout from './ProjectAccentLayout'

/** ProjectAccent logic: slow rotate + drift of the glass group. */
export default function ProjectAccentContainer({ tier }: { tier: Tier }) {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const color = tierColor[tier]

  useFrame((state, delta) => {
    const g = group.current
    if (!g || reducedMotion) return
    g.rotation.z += delta * 0.05
    g.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
  })

  return <ProjectAccentLayout groupRef={group} color={color} />
}
