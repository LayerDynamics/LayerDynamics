import { describe, it, expect } from 'vitest'
import { getPortalData } from './PortalData'

describe('forge portal catalog entry', () => {
  it('mirrors the provider id with card chrome (blurb + repo)', () => {
    const e = getPortalData('forge')!
    expect(e.label).toBe('Forge')
    expect(e.kind).toBe('dynamic')
    expect(e.preferredPresenter).toBe('dom-window')
    expect(e.defaultSize).toEqual([4, 2.6])
    expect(e.repoUrl).toBe('https://github.com/LayerDynamics/forge')
    expect(e.siteUrl).toBe('https://forge-deno.com')
    expect(e.description).toMatch(/Electron-like desktop application framework/)
  })
})
