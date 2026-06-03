// The single source of truth for every shape that crosses the host↔provider
// boundary. Client (tsconfig.web) and provider (tsconfig.node) both import this.
// DOM/Node-agnostic: no `window`, no `process`, no three.js imports here.

export const APP_KINDS = ['native', 'static', 'dynamic', 'stream'] as const
export type AppKind = (typeof APP_KINDS)[number]

export const PRESENTER_KINDS = ['dom-window', 'texture', 'stencil'] as const
export type PresenterKind = (typeof PRESENTER_KINDS)[number]

export const PORTAL_STATES = ['dormant', 'warming', 'live', 'idle'] as const
export type PortalState = (typeof PORTAL_STATES)[number]

export type ServeStrategy = 'static' | 'dynamic' | 'stream' | 'native'

/** Iframe sandbox tokens (subset we use). */
export type SandboxToken =
  | 'allow-scripts'
  | 'allow-forms'
  | 'allow-popups'
  | 'allow-modals'
  | 'allow-pointer-lock'
  | 'allow-downloads'
  | 'allow-same-origin'

/**
 * A registered, allowlisted guest app. Provider AppPortalConfig is source of
 * truth; PortalDataEntry (client) is a UI-facing mirror with a subset of fields.
 */
export interface RegisteredApp {
  id: string
  label: string
  kind: AppKind
  /** Real origin of the guest (url:port). Provider serves/proxies/streams this. */
  origin: string
  serveStrategy: ServeStrategy
  preferredPresenter: PresenterKind
  /** Sandbox tokens applied to the dom-window iframe for this app. */
  sandbox: SandboxToken[]
  /** Default aperture size in world units [w, h]. */
  defaultSize: [number, number]
}

/** Client-side mirror (no origin/sandbox secrets needed to place a portal). */
export type PortalDataEntry = Pick<
  RegisteredApp,
  'id' | 'label' | 'kind' | 'preferredPresenter' | 'defaultSize'
>

/** Provider allowlist entry = RegisteredApp plus serving knobs. */
export interface AppPortalConfigEntry extends RegisteredApp {
  /** For 'static': absolute path to the built dir the provider serves. */
  staticDir?: string
  /** For 'dynamic': upstream base the provider reverse-proxies same-origin. */
  upstream?: string
  /** Header overrides applied to served/proxied responses (e.g. frame-ancestors). */
  headers?: Record<string, string>
}

/** Result of host↔provider negotiation — tells the host how to present app X. */
export interface TransportDescriptor {
  transport: PresenterKind
  /** dom-window: same-origin URL the iframe loads (served/proxied by provider). */
  url?: string
  /** stream/texture: WS endpoint that emits frames. */
  streamEndpoint?: string
  /** native: true → render in-engine, no DOM/stream. */
  native?: boolean
  sandbox?: SandboxToken[]
  /** Intrinsic guest pixel dims for texture sizing / iframe logical size. */
  dims?: [number, number]
}

/** Serializable input forwarded to a texture-presented guest (FR-9). */
export interface ForwardedInput {
  kind: 'pointerdown' | 'pointermove' | 'pointerup' | 'wheel' | 'keydown' | 'keyup'
  /** Normalized [0..1] coordinates within the portal aperture. */
  x?: number
  y?: number
  button?: number
  deltaY?: number
  key?: string
  code?: string
}

/** Control-channel message union (host↔provider, validated targetOrigin). */
export type PortalMessage =
  | { type: 'negotiate'; portalId: string; appId: string }
  | { type: 'warm'; portalId: string; appId: string }
  | { type: 'engaged'; portalId: string }
  | { type: 'idle'; portalId: string }
  | { type: 'dispose'; portalId: string }
  | { type: 'input'; portalId: string; event: ForwardedInput }
  | { type: 'state'; portalId: string; state: PortalState }
  | { type: 'error'; portalId: string; message: string }

/** Canonical route templates. Functions take an id and return the concrete path. */
export const ROUTES = {
  config: '/config',
  portal: (id: string) => `/portal/${id}`,
  appPortal: (appId: string, action: 'warm' | 'suspend' | 'dispose') =>
    `/app-portal/${appId}/${action}`,
  static: (appId: string) => `/static/${appId}`,
  dynamic: (appId: string) => `/dynamic/${appId}`,
  stream: (appId: string) => `/stream/${appId}`,
  transitions: '/transitions',
} as const

const MESSAGE_REQUIRED: Record<PortalMessage['type'], readonly string[]> = {
  negotiate: ['portalId', 'appId'],
  warm: ['portalId', 'appId'],
  engaged: ['portalId'],
  idle: ['portalId'],
  dispose: ['portalId'],
  input: ['portalId', 'event'],
  state: ['portalId', 'state'],
  error: ['portalId', 'message'],
}

/** Runtime guard — used on both sides to reject malformed / off-origin traffic. */
export function isPortalMessage(value: unknown): value is PortalMessage {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.type !== 'string') return false
  const required = MESSAGE_REQUIRED[v.type as PortalMessage['type']]
  if (!required) return false
  return required.every((k) => v[k] !== undefined && v[k] !== null)
}
