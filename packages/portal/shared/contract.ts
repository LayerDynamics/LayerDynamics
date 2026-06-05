// The single source of truth for every shape that crosses the host↔provider
// boundary. Client (tsconfig.web) and provider (tsconfig.node) both import this.
// DOM/Node-agnostic: no `window`, no `process`, no three.js imports here.

export const APP_KINDS = ['native', 'static', 'dynamic', 'stream'] as const
export type AppKind = (typeof APP_KINDS)[number]

export const PRESENTER_KINDS = ['dom-window', 'texture', 'stencil'] as const
export type PresenterKind = (typeof PRESENTER_KINDS)[number]

export const PORTAL_STATES = ['dormant', 'warming', 'live', 'idle'] as const
export type PortalState = (typeof PORTAL_STATES)[number]

// 'direct' embeds a framing-permissive external app at its own origin (no proxy)
// — required for SPAs with absolute asset paths that a path-prefix proxy would
// break, and safe only when the app sets no X-Frame-Options/CSP frame-ancestors.
export type ServeStrategy = 'static' | 'dynamic' | 'direct' | 'stream' | 'native'

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
> & {
  /** Short, human-facing blurb shown on the dormant (pre-click) portal card. */
  description?: string
  /** Source-repository URL surfaced in the open overlay's header chrome. */
  repoUrl?: string
  /** Public live-site URL surfaced as the "Go to site" action in the overlay header. */
  siteUrl?: string
}

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

/** Stream frame header (sent as JSON, immediately followed by a binary bitmap
 *  blob) over the /stream WS — the texture presenter's frame transport (OQ-4). */
export interface StreamFrameMeta {
  type: 'frame'
  portalId: string
  w: number
  h: number
  seq: number
}

/** Runtime guard for a stream frame header. */
export function isStreamFrame(v: unknown): v is StreamFrameMeta {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    o.type === 'frame' &&
    typeof o.portalId === 'string' &&
    typeof o.w === 'number' &&
    typeof o.h === 'number' &&
    typeof o.seq === 'number'
  )
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

/**
 * A contact-form inquiry forwarded to the provider's `/api/inquiry` endpoint.
 * The provider holds the Discord webhook server-side and builds the embed, so
 * the write-capable webhook URL never reaches the client bundle. All fields are
 * already human-readable strings (the client resolves project-type labels).
 */
export interface InquiryPayload {
  name: string
  email: string
  /** Human-readable project-type label (resolved client-side). */
  projectType: string
  /** Free-text budget, or '' when not provided. */
  budget: string
  message: string
}

/** Runtime guard for an inbound inquiry — rejects malformed bodies server-side. */
export function isInquiryPayload(value: unknown): value is InquiryPayload {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.name === 'string' &&
    typeof v.email === 'string' &&
    typeof v.projectType === 'string' &&
    typeof v.budget === 'string' &&
    typeof v.message === 'string'
  )
}

/** Canonical route templates. Functions take an id and return the concrete path. */
export const ROUTES = {
  config: '/config',
  /** Contact-form proxy: client POSTs an InquiryPayload; provider forwards to Discord. */
  inquiry: '/api/inquiry',
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
