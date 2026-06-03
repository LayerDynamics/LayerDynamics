import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { serveDynamic } from '../../lib/AppPortal/Dynamic/APDynamicServe'

/** Allowlist-guarded dynamic proxying. Rejects unknown ids before proxying. */
export function registerDynamicRoutes(
  app: FastifyInstance,
  manager: AppPortalManager,
  allowedOrigin?: string,
): void {
  app.addHook('onRequest', async (req, reply) => {
    const m = /^\/dynamic\/([^/]+)(?:\/|$)/.exec(req.url)
    if (m && !manager.has(m[1])) {
      await reply.code(403).send({ error: 'unregistered app' })
    }
  })
  serveDynamic(app, manager, allowedOrigin)
}
