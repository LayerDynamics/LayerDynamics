import { describe, it, expect, beforeEach } from 'vitest'
import { usePortalStore } from './portalStore'

beforeEach(() => usePortalStore.getState().reset())

describe('portalStore', () => {
  it('registers a portal as dormant and transitions state', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    expect(usePortalStore.getState().portals['p1'].state).toBe('dormant')
    s.setState('p1', 'live')
    expect(usePortalStore.getState().portals['p1'].state).toBe('live')
  })
  it('updates the projected quad', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.setQuad('p1', { x: 10, y: 20, w: 100, h: 60, visible: true })
    expect(usePortalStore.getState().portals['p1'].quad?.w).toBe(100)
  })
  it('remove deletes the portal', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.remove('p1')
    expect(usePortalStore.getState().portals['p1']).toBeUndefined()
  })
})
