import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../../../api/app'

const app = buildApp()
afterAll(() => app.close())

describe('APStaticServe', () => {
  it('serves a registered static app same-origin', async () => {
    const res = await app.inject({ method: 'GET', url: '/static/demo-static/' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('clicks:')
  })

  it('refuses an unregistered app id (allowlist)', async () => {
    const res = await app.inject({ method: 'GET', url: '/static/evil/' })
    expect(res.statusCode).toBe(403)
  })
})
