import { describe, it, expect } from 'vitest'
import { negotiateTransport } from './PortalAppConnector'
import { AppPortalManager } from '../AppPortal/AppPortalManager'

const m = new AppPortalManager()

describe('negotiateTransport', () => {
  it('static → dom-window pointing at the same-origin /static URL', () => {
    const t = negotiateTransport(m, 'demo-static')
    expect(t).toMatchObject({ transport: 'dom-window', url: '/static/demo-static/' })
    expect(t?.sandbox).toContain('allow-scripts')
  })
  it('dynamic → dom-window pointing at the same-origin /dynamic proxy', () => {
    expect(negotiateTransport(m, 'demo-dynamic')?.url).toBe('/dynamic/demo-dynamic/')
  })
  it('stream → texture with a /stream WS endpoint', () => {
    const t = negotiateTransport(m, 'demo-stream')
    expect(t).toMatchObject({ transport: 'texture', streamEndpoint: '/stream/demo-stream' })
  })
  it('native → stencil', () => {
    expect(negotiateTransport(m, 'demo-native')).toMatchObject({ transport: 'stencil', native: true })
  })
  it('unregistered → null (never negotiate an unknown origin)', () => {
    expect(negotiateTransport(m, 'evil')).toBeNull()
  })
})
