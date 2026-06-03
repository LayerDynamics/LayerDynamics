import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { PortalDebugOverlay } from './PortalDebugOverlay'
import { usePortalStore } from '../stores/portalStore'

beforeEach(() => usePortalStore.getState().reset())
afterEach(() => cleanup())

describe('PortalDebugOverlay', () => {
  it('renders nothing unless debug is enabled', async () => {
    const screen = await render(<PortalDebugOverlay />)
    expect(screen.container.querySelector('[data-testid="portal-debug-overlay"]')).toBeNull()
  })

  it('lists each mounted portal with its state and presenter when debug', async () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.setTransport('p1', { transport: 'dom-window', url: '/static/demo-static/' })
    s.transition('p1', 'engage', 1)
    s.transition('p1', 'ready', 2)
    const screen = await render(<PortalDebugOverlay debug />)
    const row = screen.container.querySelector('[data-portal-id="p1"]')
    expect(row).toBeTruthy()
    expect(row!.textContent).toContain('demo-static')
    expect(row!.textContent).toContain('live')
    expect(row!.textContent).toContain('dom-window')
  })
})
