import { Portal } from '@layerdynamics/portal'

const ENV_ORIGIN = import.meta.env.VITE_PORTAL_ORIGIN as string | undefined
const ENV_APP = import.meta.env.VITE_PORTAL_APP as string | undefined

interface Props {
  /** Registered app id (defaults to VITE_PORTAL_APP). */
  app?: string
  /** Provider origin (defaults to VITE_PORTAL_ORIGIN). */
  providerOrigin?: string
  position?: [number, number, number]
  size?: [number, number]
}

/**
 * Consumer #1 of `@layerdynamics/portal`: windows a registered live app into the
 * Other Work level. Inert (renders nothing) unless both a provider origin and an
 * app id are supplied — by props (tests/stories) or by the VITE_PORTAL_ORIGIN /
 * VITE_PORTAL_APP build env. Production is unaffected until the owner configures a
 * deployed provider + registers the app, so no origin is ever hardcoded here.
 */
export function PortalShowcase({
  app = ENV_APP,
  providerOrigin = ENV_ORIGIN,
  position = [0, 0, 0.6],
  size = [3, 2],
}: Props) {
  if (!app || !providerOrigin) return null
  return <Portal app={app} providerOrigin={providerOrigin} position={position} size={size} />
}
