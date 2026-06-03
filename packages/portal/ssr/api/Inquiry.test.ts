import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from './app'
import { ROUTES } from '../../shared/contract'

const WEBHOOK = 'https://discord.com/api/webhooks/test-id/test-token'
const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  projectType: 'Web application',
  budget: '$5k',
  message: 'Interested in working together.',
}
const JSON_HEADERS = { 'content-type': 'application/json' }

/** A minimal Response-like for the global fetch mock; the route only reads
 *  `.ok` / `.status`. */
function fakeResponse(ok: boolean, status: number) {
  return { ok, status } as Response
}

describe('POST /api/inquiry (Discord proxy)', () => {
  let app: FastifyInstance
  const prevWebhook = process.env.DISCORD_WEBHOOK_URL

  beforeEach(async () => {
    app = buildApp()
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
    vi.unstubAllGlobals()
    if (prevWebhook === undefined) delete process.env.DISCORD_WEBHOOK_URL
    else process.env.DISCORD_WEBHOOK_URL = prevWebhook
  })

  it('forwards a valid inquiry to the server-side webhook and returns 204', async () => {
    process.env.DISCORD_WEBHOOK_URL = WEBHOOK
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => fakeResponse(true, 204))
    vi.stubGlobal('fetch', fetchMock)

    const res = await app.inject({
      method: 'POST',
      url: ROUTES.inquiry,
      headers: JSON_HEADERS,
      payload: VALID,
    })

    expect(res.statusCode).toBe(204)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(WEBHOOK)
    const body = JSON.parse(init.body as string)
    expect(body.embeds[0].fields).toContainEqual({
      name: 'Email',
      value: 'ada@example.com',
      inline: true,
    })
  })

  it('returns 503 (not 5xx crash) when the webhook is not configured', async () => {
    delete process.env.DISCORD_WEBHOOK_URL
    const fetchMock = vi.fn(async () => fakeResponse(true, 204))
    vi.stubGlobal('fetch', fetchMock)

    const res = await app.inject({
      method: 'POST',
      url: ROUTES.inquiry,
      headers: JSON_HEADERS,
      payload: VALID,
    })

    expect(res.statusCode).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a malformed payload with 400 before contacting Discord', async () => {
    process.env.DISCORD_WEBHOOK_URL = WEBHOOK
    const fetchMock = vi.fn(async () => fakeResponse(true, 204))
    vi.stubGlobal('fetch', fetchMock)

    const res = await app.inject({
      method: 'POST',
      url: ROUTES.inquiry,
      headers: JSON_HEADERS,
      payload: { name: 'only a name' },
    })

    expect(res.statusCode).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 502 when Discord rejects the post', async () => {
    process.env.DISCORD_WEBHOOK_URL = WEBHOOK
    vi.stubGlobal('fetch', vi.fn(async () => fakeResponse(false, 400)))

    const res = await app.inject({
      method: 'POST',
      url: ROUTES.inquiry,
      headers: JSON_HEADERS,
      payload: VALID,
    })

    expect(res.statusCode).toBe(502)
  })

  it('rate-limits abusive volume per IP (CORS cannot guard an open relay)', async () => {
    process.env.DISCORD_WEBHOOK_URL = WEBHOOK
    vi.stubGlobal('fetch', vi.fn(async () => fakeResponse(true, 204)))

    const codes: number[] = []
    for (let i = 0; i < 7; i++) {
      const res = await app.inject({
        method: 'POST',
        url: ROUTES.inquiry,
        headers: JSON_HEADERS,
        payload: VALID,
      })
      codes.push(res.statusCode)
    }

    // Route cap is 5 / 10 min; the 6th+ from the same IP are throttled.
    expect(codes.filter((c) => c === 204)).toHaveLength(5)
    expect(codes).toContain(429)
  })
})
