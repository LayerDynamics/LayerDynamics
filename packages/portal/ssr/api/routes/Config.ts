import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { ROUTES, type PortalDataEntry } from '../../../shared/contract'

/** GET /config — advertises registered apps as client-mirror entries.
 *  Deliberately omits origin/sandbox so server-only secrets never reach the client. */
export function registerConfigRoute(app: FastifyInstance, manager: AppPortalManager): void {
  app.get(ROUTES.config, async () => {
    const apps: PortalDataEntry[] = manager.list().map((a) => ({
      id: a.id,
      label: a.label,
      kind: a.kind,
      preferredPresenter: a.preferredPresenter,
      defaultSize: a.defaultSize,
    }))
    return { apps }
  })
}
