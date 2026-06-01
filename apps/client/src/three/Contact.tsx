import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { MathUtils, type Group } from 'three'
import { useScene } from '../stores/useScene'
import { social, owner } from '../data/social'
import { brand } from '../styles/brand'
import { useScrollRange } from '../hooks/useScrollRange'

const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'
const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

/** Bottom of the scene: the close, with clickable social links. Sits at the
 *  store's dynamic contactY so it tracks the collection's depth, and rises into
 *  place as the camera arrives (scroll-range reveal). */
export default function Contact() {
  const contactY = useScene((s) => s.contactY)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const inner = useRef<Group>(null)
  const enter = useScrollRange(0.82, 0.18)

  useFrame((_, delta) => {
    const g = inner.current
    if (!g) return
    const p = enter.current
    if (reducedMotion) {
      g.position.y = 0
      return
    }
    g.position.y = MathUtils.damp(g.position.y, (1 - p) * -1.4, 5, delta)
  })

  const open = (href: string, sameTab: boolean) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    window.open(href, sameTab ? '_self' : '_blank', 'noopener,noreferrer')
  }
  const cursor = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = on ? 'pointer' : 'auto'
  }

  return (
    <group position={[0, contactY, 0]}>
      <group ref={inner}>
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
