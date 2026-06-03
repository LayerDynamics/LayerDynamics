import type { FastifyInstance } from 'fastify'
import fastifyStatic from '@fastify/static'
import type { AppPortalManager } from '../AppPortalManager'

/** Mounts @fastify/static for every registered static app under /static/:id/.
 *  Each app's built directory is served from the provider's own origin so the
 *  host can window it in an interactive iframe without cross-origin tainting. */
export function serveStatic(app: FastifyInstance, manager: AppPortalManager): void {
  let first = true
  for (const entry of manager.list()) {
    if (entry.serveStrategy !== 'static' || !entry.staticDir) continue
    app.register(fastifyStatic, {
      root: entry.staticDir,
      prefix: `/static/${entry.id}/`,
      // Only the first registration may decorate reply.sendFile; later ones must not.
      decorateReply: first,
    })
    first = false
  }
}
