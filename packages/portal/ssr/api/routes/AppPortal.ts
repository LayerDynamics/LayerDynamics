import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { registerAppPortal } from '../../lib/AppPortal/AppPortalRoutes'

export function registerAppPortalRoutes(app: FastifyInstance, manager: AppPortalManager): void {
  registerAppPortal(app, manager)
}
