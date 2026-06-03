import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from './app'

const ORIGIN = 'https://layerdynamics.example'
const app = buildApp({ allowedOrigin: ORIGIN })
afterAll(() => app.close())

describe('provider security', () => {
  it('refuses every provider route for an unregistered app id (403)', async () => {
    const gets = ['/static/evil/', '/dynamic/evil/', '/portal/p1?app=evil']
    for (const url of gets) {
      const res = await app.inject({ method: 'GET', url })
      expect(res.statusCode, url).toBe(403)
    }
    const warm = await app.inject({ method: 'POST', url: '/app-portal/evil/warm' })
    expect(warm.statusCode).toBe(403)
  })

  it('pins frame-ancestors to the allowed host origin on served responses', async () => {
    const res = await app.inject({ method: 'GET', url: '/static/demo-static/' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-security-policy']).toBe(`frame-ancestors ${ORIGIN}`)
  })

  it('does not leak server-only secrets (origin/sandbox) through /config', async () => {
    const res = await app.inject({ method: 'GET', url: '/config' })
    const body = res.json() as { apps: Array<Record<string, unknown>> }
    for (const a of body.apps) {
      expect(a.origin).toBeUndefined()
      expect(a.sandbox).toBeUndefined()
      expect(a.upstream).toBeUndefined()
    }
  })
})

describe('provider security (no allowedOrigin → permissive dev mode)', () => {
  const dev = buildApp()
  afterAll(() => dev.close())
  it('omits the frame-ancestors CSP when no host origin is configured', async () => {
    const res = await dev.inject({ method: 'GET', url: '/static/demo-static/' })
    expect(res.headers['content-security-policy']).toBeUndefined()
  })
})
