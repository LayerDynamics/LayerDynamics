import { describe, it, expect, beforeEach } from 'vitest'
import { usePortalStore } from './portalStore'

beforeEach(() => usePortalStore.getState().reset())

describe('portalStore lifecycle guard', () => {
  it('applies legal transitions and ignores illegal ones', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.transition('p1', 'engage') // dormant → warming
    expect(usePortalStore.getState().portals['p1'].state).toBe('warming')
    s.transition('p1', 'engage') // no-op from warming
    expect(usePortalStore.getState().portals['p1'].state).toBe('warming')
    s.transition('p1', 'disengage') // warming → dormant
    expect(usePortalStore.getState().portals['p1'].state).toBe('dormant')
  })
  it('records lastEngagedAt and engaged when entering live', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.transition('p1', 'engage', 100)
    s.transition('p1', 'ready', 250) // warming → live
    const p = usePortalStore.getState().portals['p1']
    expect(p.state).toBe('live')
    expect(p.engaged).toBe(true)
    expect(p.lastEngagedAt).toBe(250)
  })
  it('live → idle on disengage clears engaged but keeps lastEngagedAt', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.transition('p1', 'engage', 10)
    s.transition('p1', 'ready', 20)
    s.transition('p1', 'disengage', 30) // live → idle
    const p = usePortalStore.getState().portals['p1']
    expect(p.state).toBe('idle')
    expect(p.engaged).toBe(false)
    expect(p.lastEngagedAt).toBe(20)
  })
})

describe('portalStore MAX_LIVE enforcement (cap=1)', () => {
  it('demotes the previously-live portal to idle when a second engages', () => {
    const s = usePortalStore.getState()
    s.reset()
    s.register('a', 'demo-static')
    s.register('b', 'demo-dynamic')
    s.transition('a', 'engage', 10)
    s.transition('a', 'ready', 20) // a live
    s.transition('b', 'engage', 30)
    s.transition('b', 'ready', 40) // b live → a demoted (LRU)
    const st = usePortalStore.getState().portals
    expect(st['b'].state).toBe('live')
    expect(st['a'].state).toBe('idle')
    expect(st['a'].engaged).toBe(false)
  })
})
