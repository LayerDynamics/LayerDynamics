import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { Text } from '@react-three/drei'
import ContactLayout from '../Contact/ContactLayout'
import { scrollProgress } from '../../../stores/levelScroll'
import { useScene } from '../../../stores/useScene'
import { brand } from '../../../styles/brand'

const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'

/**
 * Hire-me level (terminal): the close — headline, intro, social links, and a
 * prominent route into the full HireMe form at /hire. Framed at the origin;
 * gently settles in as the level arrives.
 */
export default function HireMeLevel({ onHire }: { onHire: () => void }) {
  const inner = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)

  useFrame((_, delta) => {
    const g = inner.current
    if (!g) return
    if (reducedMotion) {
      g.position.y = 0
      return
    }
    // Settle upward as in-level progress grows (subtle arrival).
    const p = scrollProgress.current
    g.position.y = MathUtils.damp(g.position.y, (1 - p) * -0.8, 5, delta)
  })

  const open = (href: string, sameTab: boolean) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    window.open(href, sameTab ? '_self' : '_blank', 'noopener,noreferrer')
  }
  const cursor = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = on ? 'pointer' : 'auto'
  }
  const hire = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onHire()
  }

  return (
    <group>
      <ContactLayout contactY={0} innerRef={inner} open={open} cursor={cursor} />
      <Text
        font={FONT_BOLD}
        position={[0, -3.0, 0]}
        fontSize={0.26}
        color={brand.violet}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
        onClick={hire}
        onPointerOver={cursor(true)}
        onPointerOut={cursor(false)}
      >
        START A PROJECT →
      </Text>
    </group>
  )
}
