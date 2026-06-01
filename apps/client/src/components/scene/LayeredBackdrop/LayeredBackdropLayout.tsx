import type { RefObject } from 'react'
import { AdditiveBlending, type Group, type Texture } from 'three'
import { Starfield } from '../Starfield'

export interface LayeredBackdropLayoutProps {
  /** The group the container parallax-shifts with the pointer. */
  groupRef: RefObject<Group | null>
  /** Radial-gradient texture for the soft hero glow plane. */
  glow: Texture
}

/**
 * Presentational backdrop: the drifting starfield plus a soft radial halo behind
 * the hero so it glows out of the dark. The container supplies the parallax
 * group ref and the glow texture.
 */
export default function LayeredBackdropLayout({ groupRef, glow }: LayeredBackdropLayoutProps) {
  return (
    <group ref={groupRef}>
      <Starfield />

      {/* Soft radial halo sitting behind the hero. Focused/restrained so the
          frame stays dark and the monolith holds contrast. */}
      <mesh position={[0, 2.0, -7]}>
        <planeGeometry args={[19, 19]} />
        <meshBasicMaterial
          map={glow}
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
