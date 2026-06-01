import type { RefObject } from 'react'
import type { Group } from 'three'
import { GlassLayer } from '../GlassLayer'
import { LogoSpin } from '../LogoSpin'
import { brand } from '../../../styles/brand'

export interface ProjectAccentLayoutProps {
  /** The group the container slowly rotates/drifts. */
  groupRef: RefObject<Group | null>
  /** Tier tint for the lights + glass. */
  color: string
}

/**
 * Presentational mini-scene for a project detail page: tier-tinted layered glass
 * behind the spinning brand mark, lit by a key + tier rim light.
 */
export default function ProjectAccentLayout({ groupRef, color }: ProjectAccentLayoutProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 6]} intensity={28} distance={30} color={brand.lavender} />
      <pointLight position={[-3, -2, 5]} intensity={22} distance={30} color={color} />

      <group ref={groupRef}>
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
