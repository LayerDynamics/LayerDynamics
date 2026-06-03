import { describe, it, expect, vi, afterEach } from 'vitest'
import { negotiate, resolveUrl } from './connector'

afterEach(() => vi.unstubAllGlobals())

describe('connector.negotiate', () => {
  it('resolves a TransportDescriptor from the provider /portal endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              portalId: 'p1',
              transport: { transport: 'dom-window', url: '/static/demo-static/', sandbox: ['allow-scripts'] },
            }),
            { status: 200 },
          ),
      ),
    )
    const t = await negotiate('http://localhost:5179', 'p1', 'demo-static')
    expect(t?.transport).toBe('dom-window')
    expect(t?.url).toBe('/static/demo-static/')
  })

  it('returns null on a 403 (unregistered)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 403 })))
    expect(await negotiate('http://localhost:5179', 'p1', 'evil')).toBeNull()
  })
})

describe('connector.resolveUrl', () => {
  it('joins a provider-relative transport url to an absolute one', () => {
    expect(resolveUrl('http://localhost:5179', { transport: 'dom-window', url: '/static/x/' })).toBe(
      'http://localhost:5179/static/x/',
    )
  })
  it('returns undefined when there is no url (texture/stencil)', () => {
    expect(resolveUrl('http://localhost:5179', { transport: 'stencil', native: true })).toBeUndefined()
  })
})
