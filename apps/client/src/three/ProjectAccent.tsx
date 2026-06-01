import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import GlassLayer from './GlassLayer'
import LogoSpin from './LogoSpin'
import type { Tier } from '../data/projects'
import { tierColor, brand } from '../styles/brand'
import { useScene } from '../stores/useScene'

/**
 * The small 3D accent on a project detail page: tier-tinted layered glass behind
 * the spinning brand mark. Self-contained scene content for its own mini Canvas.
 */
export default function ProjectAccent({ tier }: { tier: Tier }) {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const color = tierColor[tier]

  useFrame((state, delta) => {
    const g = group.current
    if (!g || reducedMotion) return
    g.rotation.z += delta * 0.05
    g.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 6]} intensity={28} distance={30} color={brand.lavender} />
      <pointLight position={[-3, -2, 5]} intensity={22} distance={30} color={color} />

      <group ref={group}>
        <GlassLayer
          position={[0, 0, -2]}
          width={7}
          height={4.4}
          color={color}
          opacity={0.1}
          edge={brand.lavender}
          edgeOpacity={0.18}
        />
        <GlassLayer
          position={[0, 0, -1]}
          width={5.4}
          height={3.3}
          color={color}
          opacity={0.13}
          edge={brand.lavender}
          edgeOpacity={0.3}
        />
      </group>

      <LogoSpin scale={1.1} />
    </>
  )
}
