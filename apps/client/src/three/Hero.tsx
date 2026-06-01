import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { MathUtils, type Group } from 'three'
import LogoSpin from './LogoSpin'
import { brand } from '../styles/brand'
import { owner } from '../data/social'
import { useScrollRange } from '../hooks/useScrollRange'
import { useScene } from '../stores/useScene'

// Bundled locally so the 3D type renders crisply and offline (drei <Text>
// otherwise fetches a default Roboto from a CDN).
const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'
const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

/** Top of the scene: the layered-glass monolith over the name + tagline. Rises
 *  and recedes slightly as the camera scrolls past it (scroll-range reveal). */
export default function Hero() {
  const inner = useRef<Group>(null)
  const exit = useScrollRange(0, 0.16)
  const reducedMotion = useScene((s) => s.reducedMotion)

  useFrame((_, delta) => {
    const g = inner.current
    if (!g) return
    const p = exit.current
    if (reducedMotion) {
      g.position.y = 0
      g.scale.setScalar(1)
      return
    }
    g.position.y = MathUtils.damp(g.position.y, p * 1.6, 5, delta)
    g.scale.setScalar(MathUtils.damp(g.scale.x, 1 - p * 0.08, 5, delta))
  })

  return (
    <group position={[0, 0, 0]}>
      <group ref={inner}>
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
