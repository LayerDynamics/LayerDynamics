import { useThree } from '@react-three/fiber'
import { PortalShowcase } from '../PortalShowcase/PortalShowcase'
import { portalLayout } from '../PortalShowcase/portalLayout'

/** Registered apps shown in this level, left→right / top→bottom. */
const APPS = ['wasmos', 'forge'] as const

interface Props {
  /** Provider origin forwarded to each card (defaults to VITE_PORTAL_ORIGIN via
   *  PortalShowcase). Supplied by stories/tests so the cards render off-env. */
  providerOrigin?: string
}

/**
 * Other Work level: live windowed apps (portals). Renders one PortalShowcase per
 * registered app, laid out responsively (side-by-side on desktop, stacked on a
 * phone) by viewport aspect. Provider origin comes from VITE_PORTAL_ORIGIN; the
 * cards are inert until it is set. More portals are added by extending APPS.
 */
export default function OtherWorkLevel({ providerOrigin }: Props) {
  const aspect = useThree((s) => s.viewport.aspect)
  const slots = portalLayout(APPS.length, aspect)
  return (
    <>
      {APPS.map((app, i) => (
        <PortalShowcase
          key={app}
          app={app}
          providerOrigin={providerOrigin}
          position={slots[i].position}
          size={slots[i].size}
        />
      ))}
    </>
  )
}
