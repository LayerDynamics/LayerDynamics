import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import { buildApp } from '../app'

const ORIGIN = 'https://layerdynamics.example'

// A real upstream "live app" the provider reverse-proxies same-origin. It tries
// to forbid framing, which the proxy must override so OUR origin can embed it.
const upstream = Fastify()
upstream.get('/', async (_req, reply) => {
  reply.header('x-frame-options', 'DENY')
  reply.header('content-security-policy', "frame-ancestors 'none'")
  return '<h1>live app</h1>'
})
const provider = buildApp()
const securedProvider = buildApp({ allowedOrigin: ORIGIN })

beforeAll(async () => {
  await upstream.listen({ port: 5181 })
  await provider.ready()
  await securedProvider.ready()
})
afterAll(async () => {
  await upstream.close()
  await provider.close()
  await securedProvider.close()
})

describe('APDynamicServe', () => {
  it('proxies a registered dynamic app onto the provider origin', async () => {
    const res = await provider.inject({ method: 'GET', url: '/dynamic/demo-dynamic/' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('live app')
  })

  it('refuses unregistered dynamic ids', async () => {
    const res = await provider.inject({ method: 'GET', url: '/dynamic/evil/' })
    expect(res.statusCode).toBe(403)
  })

  it('replaces the upstream framing protections with a tight frame-ancestors', async () => {
    const res = await securedProvider.inject({ method: 'GET', url: '/dynamic/demo-dynamic/' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['x-frame-options']).toBeUndefined()
    expect(res.headers['content-security-policy']).toBe(`frame-ancestors ${ORIGIN}`)
  })
})
