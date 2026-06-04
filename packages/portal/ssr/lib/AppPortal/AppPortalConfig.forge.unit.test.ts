import { describe, it, expect } from 'vitest'
import { getApp, isRegistered } from './AppPortalConfig'

describe('forge registration', () => {
  it('is allowlisted as a direct-embed app at its own origin', () => {
    expect(isRegistered('forge')).toBe(true)
    const app = getApp('forge')!
    expect(app.origin).toBe('https://forge-deno.com')
    expect(app.serveStrategy).toBe('direct')
    // Direct-embed apps are `kind: 'dynamic'` (WASM_OS precedent); the allowlist
    // invariant reserves `kind: 'static'` for provider-served apps.
    expect(app.kind).toBe('dynamic')
    expect(app.preferredPresenter).toBe('dom-window')
    // Tight sandbox — a static marketing/docs site, not an OS.
    expect(app.sandbox).toEqual(['allow-scripts', 'allow-popups', 'allow-same-origin'])
    expect(app.sandbox).not.toContain('allow-pointer-lock')
    expect(app.staticDir).toBeUndefined() // direct embed: not provider-served
  })
})
