import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from './AppPortalManager'
import { negotiateTransport } from '../Portal/PortalAppConnector'

/** Guest-app management endpoints. Allowlist-gated. The warm action resolves the
 *  transport the host should use; suspend/dispose are wired to the manager
 *  lifecycle in M2. */
export function registerAppPortal(app: FastifyInstance, manager: AppPortalManager): void {
  app.post<{ Params: { appId: string; action: 'warm' | 'suspend' | 'dispose' } }>(
    '/app-portal/:appId/:action',
    async (req, reply) => {
      const { appId, action } = req.params
      if (!manager.has(appId)) return reply.code(403).send({ error: 'unregistered app' })
      if (action === 'warm') {
        return { status: 'warming', transport: negotiateTransport(manager, appId) }
      }
      return { status: action === 'suspend' ? 'idle' : 'disposed' }
    },
  )
}
