import type { RefObject } from 'react'
import { AdditiveBlending, type Group, type Texture } from 'three'
import { Starfield } from '../Starfield'

export interface LayeredBackdropLayoutProps {
  /** The group the container parallax-shifts with the pointer. */
  groupRef: RefObject<Group | null>
  /** Radial-gradient texture for the soft hero glow plane. */
  glow: Texture
  /** Glow plane opacity. */
  glowOpacity?: number
  /** Glow plane size (square, world units). */
  glowSize?: number
  /** Glow plane position. */
  glowPosition?: [number, number, number]
}

/**
 * Presentational backdrop: the drifting starfield plus a soft radial halo behind
 * the hero so it glows out of the dark. The container supplies the parallax
 * group ref and the glow texture; the halo's opacity/size/position are props.
 */
export default function LayeredBackdropLayout({
  groupRef,
  glow,
  glowOpacity = 0.32,
  glowSize = 19,
  glowPosition = [0, 2.0, -7],
}: LayeredBackdropLayoutProps) {
  return (
    <group ref={groupRef}>
      <Starfield />

      {/* Soft radial halo sitting behind the hero. Focused/restrained so the
          frame stays dark and the monolith holds contrast. */}
      <mesh position={glowPosition}>
        <planeGeometry args={[glowSize, glowSize]} />
        <meshBasicMaterial
          map={glow}
          transparent
          opacity={glowOpacity}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
