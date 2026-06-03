import { describe, it, expect } from 'vitest'
import { REGISTERED_APPS, getApp, isRegistered } from './AppPortalConfig'

describe('AppPortalConfig allowlist', () => {
  it('only resolves registered app ids', () => {
    expect(isRegistered('demo-static')).toBe(true)
    expect(isRegistered('evil.example.com')).toBe(false)
  })
  it('getApp returns the full entry for a registered id and undefined otherwise', () => {
    expect(getApp('demo-static')?.origin).toBeDefined()
    expect(getApp('nope')).toBeUndefined()
  })
  it('every entry has a serveStrategy consistent with its kind', () => {
    for (const a of REGISTERED_APPS) {
      if (a.kind === 'static') expect(a.serveStrategy).toBe('static')
      if (a.kind === 'native') expect(a.serveStrategy).toBe('native')
    }
  })
  it('covers all four app kinds in the fixture set', () => {
    const kinds = new Set(REGISTERED_APPS.map((a) => a.kind))
    expect(kinds).toEqual(new Set(['static', 'dynamic', 'stream', 'native']))
  })
})
