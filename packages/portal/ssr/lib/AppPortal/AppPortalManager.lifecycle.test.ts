import { describe, it, expect } from 'vitest'
import { AppPortalManager } from './AppPortalManager'

describe('AppPortalManager lifecycle', () => {
  it('warms then suspends the least-recently-engaged guest, honoring the cap', () => {
    const m = new AppPortalManager(undefined, 1)
    m.warm('demo-static')
    expect(m.runtime('demo-static')?.status).toBe('warming')
    m.markRunning('demo-static', 10)
    expect(m.runtime('demo-static')?.status).toBe('running')

    m.warm('demo-dynamic')
    m.markRunning('demo-dynamic', 20) // exceeds cap → demo-static suspended
    expect(m.runtime('demo-dynamic')?.status).toBe('running')
    expect(m.runtime('demo-static')?.status).toBe('suspended')
    expect(m.liveCount()).toBe(1)
  })

  it('resumes a suspended guest on a subsequent warm', () => {
    const m = new AppPortalManager(undefined, 1)
    m.warm('demo-static')
    m.markRunning('demo-static', 10)
    m.suspend('demo-static')
    expect(m.runtime('demo-static')?.status).toBe('suspended')
    m.warm('demo-static') // resume
    expect(m.runtime('demo-static')?.status).toBe('running')
  })

  it('dispose removes the runtime', () => {
    const m = new AppPortalManager(undefined, 1)
    m.warm('demo-static')
    m.dispose('demo-static')
    expect(m.runtime('demo-static')).toBeUndefined()
  })

  it('refuses to warm an unregistered app', () => {
    const m = new AppPortalManager()
    expect(() => m.warm('evil')).toThrow()
  })
})
