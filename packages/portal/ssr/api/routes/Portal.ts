import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { negotiateTransport } from '../../lib/Portal/PortalAppConnector'

/** HTTP negotiation: the host asks how to present app X. Allowlist-gated. */
export function registerPortalRoutes(app: FastifyInstance, manager: AppPortalManager): void {
  app.get<{ Params: { id: string }; Querystring: { app?: string } }>(
    '/portal/:id',
    async (req, reply) => {
      const appId = req.query.app
      if (!appId) return reply.code(400).send({ error: 'missing app' })
      const transport = negotiateTransport(manager, appId)
      if (!transport) return reply.code(403).send({ error: 'unregistered app' })
      return { portalId: req.params.id, transport }
    },
  )
}
