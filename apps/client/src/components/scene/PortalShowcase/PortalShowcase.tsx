import { useEffect, useMemo, useState } from 'react'
import { Text } from '@react-three/drei'
import { PortalEdge, getPortalData, roundedRectGeometry } from '@layerdynamics/portal'
import { usePortalOverlay } from '../../../stores/usePortalOverlay'
import { brand } from '../../../styles/brand'

const ENV_ORIGIN = import.meta.env.VITE_PORTAL_ORIGIN as string | undefined
const ENV_APP = import.meta.env.VITE_PORTAL_APP as string | undefined

const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

interface Props {
  /** Registered app id (defaults to VITE_PORTAL_APP). */
  app?: string
  /** Provider origin (defaults to VITE_PORTAL_ORIGIN). */
  providerOrigin?: string
  position?: [number, number, number]
  size?: [number, number]
}

/**
 * Consumer #1 of `@layerdynamics/portal`: a clickable, framed launch element in
 * the Other Work level. It does NOT window the site into the 3D scene — clicking
 * opens the live site in a large DOM overlay (PortalOverlay) via usePortalOverlay.
 * Inert (renders nothing) unless both a provider origin and an app id are supplied
 * — by props (tests/stories) or the VITE_PORTAL_ORIGIN / VITE_PORTAL_APP build env.
 */
export function PortalShowcase({
  app = ENV_APP,
  providerOrigin = ENV_ORIGIN,
  position = [0, 0, 0.6],
  size = [4, 2.6],
}: Props) {
  const open = usePortalOverlay((s) => s.open)
  const [hover, setHover] = useState(false)

  // Pointer affordance — restore the cursor on unmount/leave so it never sticks.
  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hover])

  const [w, h] = size
  // Corner radius scales with the card but stays subtle — capped so wide cards
  // don't read as pills. Rounds both the clickable surface and the coral frame.
  const radius = Math.min(0.16, w * 0.045, h * 0.045)
  const surface = useMemo(() => roundedRectGeometry(w, h, radius), [w, h, radius])

  if (!app || !providerOrigin) return null
  const data = getPortalData(app)
  const label = data?.label ?? app
  const description = data?.description

  return (
    <group position={position}>
      {/* Clickable surface — opens the overlay (stopPropagation so the level's
          background click handlers don't also fire). */}
      <mesh
        geometry={surface}
        onClick={(e) => {
          e.stopPropagation()
          open(app, providerOrigin)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={() => setHover(false)}
      >
        <meshBasicMaterial color={brand.bg2} transparent opacity={hover ? 0.55 : 0.32} />
      </mesh>

      <PortalEdge width={w} height={h} intensity={hover ? 2 : 1.1} radius={radius} />

      <Text
        font={FONT_MED}
        position={[0, h * 0.33, 0.02]}
        fontSize={Math.min(0.42, w * 0.11)}
        color={brand.lavender}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.04}
        maxWidth={w * 0.86}
      >
        {label}
      </Text>

      {description && (
        <Text
          font={FONT_MED}
          position={[0, h * 0.0, 0.02]}
          fontSize={Math.min(0.13, w * 0.033)}
          color={brand.violetSoft}
          anchorX="center"
          anchorY="middle"
          lineHeight={1.4}
          maxWidth={w * 0.82}
        >
          {description}
        </Text>
      )}

      <Text
        font={FONT_MED}
        position={[0, -h * 0.36, 0.02]}
        fontSize={Math.min(0.2, w * 0.052)}
        color={brand.violet}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        {hover ? 'CLICK TO OPEN ↗' : 'OPEN ↗'}
      </Text>
    </group>
  )
}
