import type { RefObject } from 'react'
import { Text } from '@react-three/drei'
import type { Group } from 'three'
import { LogoSpin } from '../LogoSpin'
import { brand } from '../../../styles/brand'
import { owner } from '../../../data/social'

const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'
const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

export interface HeroLayoutProps {
  /** The inner group the container animates (reveal/scale on scroll). */
  innerRef: RefObject<Group | null>
}

/**
 * Presentational hero scene-graph: the layered-glass monolith over the name +
 * tagline. The container drives the `innerRef` group; this file only declares
 * the structure.
 */
export default function HeroLayout({ innerRef }: HeroLayoutProps) {
  return (
    <group position={[0, 0, 0]}>
      <group ref={innerRef}>
        <group position={[0, 2.0, 0]}>
          <LogoSpin scale={0.95} />
        </group>

        <Text
          font={FONT_MED}
          position={[0, -0.15, 0]}
          fontSize={0.2}
          color={brand.cyan}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.42}
        >
          LAYER DYNAMICS
        </Text>

        <Text
          font={FONT_BOLD}
          position={[0, -1.05, 0]}
          fontSize={1.05}
          color={brand.lavender}
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.01}
        >
          {owner.name}
        </Text>

        <Text
          font={FONT_MED}
          position={[0, -2.0, 0]}
          fontSize={0.24}
          color="#c4bdd6"
          anchorX="center"
          anchorY="middle"
          maxWidth={9}
          textAlign="center"
          letterSpacing={0.02}
        >
          {owner.tagline}
        </Text>

        <Text
          font={FONT_MED}
          position={[0, -2.95, 0]}
          fontSize={0.14}
          color="#6f6884"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          SCROLL TO EXPLORE ↓
        </Text>
      </group>
    </group>
  )
}
