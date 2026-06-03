import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../app'

const app = buildApp()
afterAll(() => app.close())

describe('Portal HTTP negotiation', () => {
  it('returns a dom-window transport for a registered static app', async () => {
    const res = await app.inject({ method: 'GET', url: '/portal/p1?app=demo-static' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({
      portalId: 'p1',
      transport: { transport: 'dom-window', url: '/static/demo-static/' },
    })
  })
  it('400 when app query is missing', async () => {
    expect((await app.inject({ method: 'GET', url: '/portal/p1' })).statusCode).toBe(400)
  })
  it('403 for an unregistered app', async () => {
    expect((await app.inject({ method: 'GET', url: '/portal/p1?app=evil' })).statusCode).toBe(403)
  })
})
