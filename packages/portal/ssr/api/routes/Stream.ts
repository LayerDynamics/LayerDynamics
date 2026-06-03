import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'

/** HTTP info endpoint for streamed apps (the frame transport itself is the WS
 *  relay attached in server.ts). Allowlist-gated. */
export function registerStreamRoutes(app: FastifyInstance, manager: AppPortalManager): void {
  app.get<{ Params: { appId: string } }>('/stream/:appId/info', async (req, reply) => {
    const entry = manager.get(req.params.appId)
    if (!entry) return reply.code(403).send({ error: 'unregistered app' })
    return { appId: entry.id, kind: entry.kind, streaming: entry.serveStrategy === 'stream' }
  })
}
