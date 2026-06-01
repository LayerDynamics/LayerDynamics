import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { useScene } from '../../../stores/useScene'
import { useScrollRange } from '../../../hooks/useScrollRange'
import ContactLayout from './ContactLayout'

/**
 * Contact logic: parks at the store's dynamic contactY so it tracks the
 * collection's depth, rises into place as the camera arrives (scroll-range
 * reveal), and owns the link open / cursor handlers.
 */
export default function ContactContainer() {
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

  return <ContactLayout contactY={contactY} innerRef={inner} open={open} cursor={cursor} />
}
