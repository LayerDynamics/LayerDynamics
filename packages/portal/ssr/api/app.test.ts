import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from './app'

const app = buildApp()
afterAll(() => app.close())

describe('provider app', () => {
  it('GET /config lists registered apps as client-mirror entries (no origin leak)', async () => {
    const res = await app.inject({ method: 'GET', url: '/config' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { apps: Array<{ id: string; origin?: string }> }
    expect(body.apps.map((a) => a.id)).toContain('demo-static')
    expect(body.apps[0].origin).toBeUndefined()
  })

  it('health check responds', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
  })
})
