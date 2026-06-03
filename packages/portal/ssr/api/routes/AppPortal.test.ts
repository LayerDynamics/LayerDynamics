import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../app'

const app = buildApp()
afterAll(() => app.close())

describe('AppPortal routes', () => {
  it('warm returns the resolved transport for a registered app', async () => {
    const res = await app.inject({ method: 'POST', url: '/app-portal/demo-static/warm' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'warming', transport: { transport: 'dom-window' } })
  })
  it('suspend returns idle for a registered app', async () => {
    const res = await app.inject({ method: 'POST', url: '/app-portal/demo-static/suspend' })
    expect(res.json()).toMatchObject({ status: 'idle' })
  })
  it('rejects unregistered ids', async () => {
    const res = await app.inject({ method: 'POST', url: '/app-portal/evil/warm' })
    expect(res.statusCode).toBe(403)
  })
})
