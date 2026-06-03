import { PortalShowcase } from '../PortalShowcase/PortalShowcase'

/**
 * Other Work level: live windowed apps (portals). The project-tile grid was
 * removed — this level now hosts PortalShowcase launch elements, each of which
 * opens its registered app in the PortalOverlay. More portals are added here as
 * they come online.
 */
export default function OtherWorkLevel() {
  return <PortalShowcase />
}
