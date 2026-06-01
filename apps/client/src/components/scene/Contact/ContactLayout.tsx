import type { RefObject } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Group } from 'three'
import { social, owner } from '../../../data/social'
import { brand } from '../../../styles/brand'

const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'
const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

export interface ContactLayoutProps {
  /** Dynamic world-Y of the section (tracks the collection depth). */
  contactY: number
  /** Inner group the container reveals as the camera arrives. */
  innerRef: RefObject<Group | null>
  open: (href: string, sameTab: boolean) => (e: ThreeEvent<MouseEvent>) => void
  cursor: (on: boolean) => (e: ThreeEvent<PointerEvent>) => void
}

/** Presentational close: the headline, intro, and clickable social links. */
export default function ContactLayout({ contactY, innerRef, open, cursor }: ContactLayoutProps) {
  return (
    <group position={[0, contactY, 0]}>
      <group ref={innerRef}>
        <Text
          font={FONT_BOLD}
          position={[0, 1.5, 0]}
          fontSize={0.72}
          color={brand.lavender}
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.01}
        >
          Let’s build something.
        </Text>

        <Text
          font={FONT_MED}
          position={[0, 0.6, 0]}
          fontSize={0.17}
          color="#bdb6cf"
          anchorX="center"
          anchorY="middle"
          maxWidth={8.5}
          textAlign="center"
          letterSpacing={0.02}
        >
          {owner.intro}
        </Text>

        {social.map((link, i) => (
          <Text
            key={link.id}
            font={FONT_MED}
            position={[0, -0.5 - i * 0.62, 0]}
            fontSize={0.24}
            color={brand.cyan}
            anchorX="center"
            anchorY="middle"
            onClick={open(link.href, link.id === 'email')}
            onPointerOver={cursor(true)}
            onPointerOut={cursor(false)}
          >
            {link.label} — {link.value}
          </Text>
        ))}
      </group>
    </group>
  )
}
