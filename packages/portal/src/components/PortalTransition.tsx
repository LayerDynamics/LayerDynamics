import { animated, useSpring } from '@react-spring/three'
import type { PortalState } from '../../shared/contract'

/** Scales/fades the aperture during warming→live and live→idle with a fixed
 *  spring config (identical timing on every screen — no frame-count coupling,
 *  no GSAP per the house rule). Shown over the dormant surface while warming. */
export function PortalTransition({
  state,
  width,
  height,
}: {
  state: PortalState
  width: number
  height: number
}) {
  const { scale, opacity } = useSpring({
    scale: state === 'warming' ? 0.9 : 1,
    opacity: state === 'live' ? 1 : state === 'idle' ? 0.5 : 0.85,
    config: { mass: 1, tension: 170, friction: 26 },
  })
  return (
    <animated.mesh scale={scale}>
      <planeGeometry args={[width, height]} />
      <animated.meshBasicMaterial transparent opacity={opacity} color="#ff6750" wireframe />
    </animated.mesh>
  )
}
