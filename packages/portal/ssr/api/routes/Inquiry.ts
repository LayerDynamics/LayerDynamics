import type { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { ROUTES, isInquiryPayload, type InquiryPayload } from '../../../shared/contract'

// Discord embed field values cap at 1024 chars; keep a margin for the ellipsis.
const MESSAGE_CAP = 1000

/** Build the Discord webhook payload from a validated inquiry. Kept server-side
 *  (moved out of the client) so the embed shape ships with the secret. */
function buildEmbed(values: InquiryPayload) {
  const message =
    values.message.length > MESSAGE_CAP ? `${values.message.slice(0, MESSAGE_CAP)}…` : values.message
  return {
    username: 'Layer Dynamics — Hire Me',
    embeds: [
      {
        title: `New inquiry — ${values.name || '—'}`,
        color: 0x863bff,
        fields: [
          { name: 'Name', value: values.name || '—', inline: true },
          { name: 'Email', value: values.email || '—', inline: true },
          { name: 'Project type', value: values.projectType || '—', inline: true },
          { name: 'Budget', value: values.budget || '—', inline: true },
          { name: 'Message', value: message || '—' },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

/**
 * POST /api/inquiry — server-side proxy for the apps/client "Hire Me" form.
 *
 * The Discord webhook URL is a *write-capable* secret: if it shipped in the
 * client bundle anyone could scrape it and spam the channel. Holding it here
 * (server-only `DISCORD_WEBHOOK_URL` env) keeps it out of the bundle and lets it
 * be rotated without a client rebuild. CORS alone does NOT protect this endpoint
 * (it's browser-only and the Origin header is forgeable off-browser), so the
 * route is rate-limited per-IP to cap abuse of the open relay.
 */
export function registerInquiryRoute(app: FastifyInstance): void {
  // Encapsulate the route in its own plugin so rate-limit is guaranteed to load
  // BEFORE the route is added (a top-level app.register loads during ready(),
  // after sync route registration, so its onRoute hook would miss this route).
  // Scoped registration (global:true within this child) limits only /api/inquiry.
  app.register(async (instance) => {
    await instance.register(rateLimit, { max: 5, timeWindow: '10 minutes' })

    instance.post(ROUTES.inquiry, async (req, reply) => {
      const webhook = process.env.DISCORD_WEBHOOK_URL
      if (!webhook) {
        req.log.error('DISCORD_WEBHOOK_URL is not configured — cannot forward inquiry')
        return reply.code(503).send({ error: 'inquiry delivery is not configured' })
      }
      if (!isInquiryPayload(req.body)) {
        return reply.code(400).send({ error: 'invalid inquiry payload' })
      }

      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildEmbed(req.body)),
      })
      if (!res.ok) {
        req.log.error(`Discord webhook rejected the inquiry (${res.status})`)
        return reply.code(502).send({ error: `discord delivery failed (${res.status})` })
      }
      return reply.code(204).send()
    })
  })
}
