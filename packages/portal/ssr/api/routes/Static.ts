import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { serveStatic } from '../../lib/AppPortal/Static/APStaticServe'

/** Allowlist-guarded static serving. Rejects unknown ids before any file handler. */
export function registerStaticRoutes(app: FastifyInstance, manager: AppPortalManager): void {
  app.addHook('onRequest', async (req, reply) => {
    const m = /^\/static\/([^/]+)(?:\/|$)/.exec(req.url)
    if (m && !manager.has(m[1])) {
      await reply.code(403).send({ error: 'unregistered app' })
    }
  })
  serveStatic(app, manager)
}
