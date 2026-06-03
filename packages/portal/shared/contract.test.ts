import { describe, it, expect } from 'vitest'
import {
  APP_KINDS,
  PRESENTER_KINDS,
  PORTAL_STATES,
  ROUTES,
  isPortalMessage,
  type RegisteredApp,
  type TransportDescriptor,
  type PortalMessage,
} from './contract'

describe('portal contract', () => {
  it('enumerates the four app kinds and three presenters as string unions', () => {
    expect(APP_KINDS).toEqual(['native', 'static', 'dynamic', 'stream'])
    expect(PRESENTER_KINDS).toEqual(['dom-window', 'texture', 'stencil'])
    expect(PORTAL_STATES).toEqual(['dormant', 'warming', 'live', 'idle'])
  })

  it('builds a RegisteredApp value matching the type', () => {
    const app: RegisteredApp = {
      id: 'demo-static',
      label: 'Demo Static',
      kind: 'static',
      origin: 'http://localhost:5180',
      serveStrategy: 'static',
      preferredPresenter: 'dom-window',
      sandbox: ['allow-scripts', 'allow-forms'],
      defaultSize: [3, 2],
    }
    expect(app.kind).toBe('static')
  })

  it('builds a dom-window TransportDescriptor', () => {
    const t: TransportDescriptor = {
      transport: 'dom-window',
      url: '/dynamic/demo-static/',
      sandbox: ['allow-scripts'],
      dims: [1280, 720],
    }
    expect(t.transport).toBe('dom-window')
  })

  it('exposes the canonical route templates', () => {
    expect(ROUTES.config).toBe('/config')
    expect(ROUTES.portal(':id')).toBe('/portal/:id')
    expect(ROUTES.stream('demo')).toBe('/stream/demo')
  })

  it('validates control-channel messages by shape and rejects junk', () => {
    const msg: PortalMessage = { type: 'warm', portalId: 'p1', appId: 'demo-static' }
    expect(isPortalMessage(msg)).toBe(true)
    expect(isPortalMessage({ type: 'nope' })).toBe(false)
    expect(isPortalMessage(null)).toBe(false)
    expect(isPortalMessage({ type: 'input' })).toBe(false)
  })
})
