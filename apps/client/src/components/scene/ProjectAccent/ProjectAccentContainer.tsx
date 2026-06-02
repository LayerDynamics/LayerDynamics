import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Tier } from '../../../data/projects'
import { tierColor } from '../../../styles/brand'
import { useScene } from '../../../stores/useScene'
import ProjectAccentLayout from './ProjectAccentLayout'

export interface ProjectAccentContainerProps {
  tier: Tier
  /** Continuous roll speed of the glass group (rad/s). */
  rotateSpeed?: number
  /** Horizontal drift amplitude. */
  driftAmplitude?: number
  /** Horizontal drift speed. */
  driftSpeed?: number
}

/** ProjectAccent logic: slow rotate + drift of the glass group (tuned defaults). */
export default function ProjectAccentContainer({
  tier,
  rotateSpeed = 0.05,
  driftAmplitude = 0.2,
  driftSpeed = 0.3,
}: ProjectAccentContainerProps) {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const color = tierColor[tier]

  useFrame((state, delta) => {
    const g = group.current
    if (!g || reducedMotion) return
    g.rotation.z += delta * rotateSpeed
    g.position.x = Math.sin(state.clock.elapsedTime * driftSpeed) * driftAmplitude
  })

  return <ProjectAccentLayout groupRef={group} color={color} />
}
