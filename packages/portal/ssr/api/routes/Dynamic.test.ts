import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import { buildApp } from '../app'

// A real upstream "live app" the provider reverse-proxies same-origin.
const upstream = Fastify()
upstream.get('/', async () => '<h1>live app</h1>')
const provider = buildApp()

beforeAll(async () => {
  await upstream.listen({ port: 5181 })
  await provider.ready()
})
afterAll(async () => {
  await upstream.close()
  await provider.close()
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
})
