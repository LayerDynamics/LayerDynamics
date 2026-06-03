import type { AppPortalConfigEntry } from '../../../shared/contract'

/** The allowlist. Nothing outside this array may be served, proxied, or streamed. */
export const REGISTERED_APPS: AppPortalConfigEntry[] = [
  {
    // WASM_OS — a real owner-built app, embedded directly at its own origin
    // (it sets no X-Frame-Options/CSP, and its absolute /spa-assets paths would
    // break under a path-prefix proxy). allow-same-origin lets the cross-origin
    // app keep its own origin for storage/WASM; safe because it is NOT same-origin
    // with the host. allow-pointer-lock supports its OS-style interactions.
    id: 'wasmos',
    label: 'WASM_OS',
    kind: 'dynamic',
    origin: 'https://wasmos-production.up.railway.app',
    serveStrategy: 'direct',
    preferredPresenter: 'dom-window',
    sandbox: [
      'allow-scripts',
      'allow-forms',
      'allow-popups',
      'allow-modals',
      'allow-pointer-lock',
      'allow-downloads',
      'allow-same-origin',
    ],
    defaultSize: [4, 2.6],
  },
  {
    id: 'demo-static',
    label: 'Demo Static Build',
    kind: 'static',
    origin: 'http://localhost:5180',
    serveStrategy: 'static',
    preferredPresenter: 'dom-window',
    sandbox: ['allow-scripts', 'allow-forms'],
    defaultSize: [3, 2],
    staticDir: new URL('../../fixtures/demo-static', import.meta.url).pathname,
  },
  {
    id: 'demo-dynamic',
    label: 'Demo Live App',
    kind: 'dynamic',
    origin: 'http://localhost:5181',
    serveStrategy: 'dynamic',
    preferredPresenter: 'dom-window',
    sandbox: ['allow-scripts', 'allow-forms', 'allow-popups'],
    defaultSize: [3.2, 2],
    upstream: 'http://localhost:5181',
  },
  {
    id: 'demo-stream',
    label: 'Demo Streamed App',
    kind: 'stream',
    origin: 'http://localhost:5182',
    serveStrategy: 'stream',
    preferredPresenter: 'texture',
    sandbox: [],
    defaultSize: [2.4, 1.6],
  },
  {
    id: 'demo-native',
    label: 'Demo Native World',
    kind: 'native',
    origin: 'self',
    serveStrategy: 'native',
    preferredPresenter: 'stencil',
    sandbox: [],
    defaultSize: [2.5, 2.5],
  },
]

const BY_ID = new Map(REGISTERED_APPS.map((a) => [a.id, a]))

export function isRegistered(id: string): boolean {
  return BY_ID.has(id)
}

export function getApp(id: string): AppPortalConfigEntry | undefined {
  return BY_ID.get(id)
}
