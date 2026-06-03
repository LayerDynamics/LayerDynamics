import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { registerConfigRoute } from './routes/Config'
import { registerStaticRoutes } from './routes/Static'
import { registerDynamicRoutes } from './routes/Dynamic'
import { registerPortalRoutes } from './routes/Portal'
import { registerAppPortalRoutes } from './routes/AppPortal'
import { AppPortalManager } from '../lib/AppPortal/AppPortalManager'

export interface BuildAppOptions {
  /** Origin allowed to frame/embed the provider. Tightened in M4; permissive in dev. */
  allowedOrigin?: string
}

/** Compose the provider Fastify instance. Importable by tests (app.inject) and by
 *  server.ts (which adds the WebSocket channels and listens). */
export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: false })
  const manager = new AppPortalManager()

  // Restrict CORS to the embedding host origin when known; permissive in dev.
  // M4 adds CSP frame-ancestors on served/proxied responses on top of this.
  app.register(cors, { origin: opts.allowedOrigin ?? true, credentials: false })

  app.get('/healthz', async () => ({ ok: true }))

  registerConfigRoute(app, manager)
  registerStaticRoutes(app, manager)
  registerDynamicRoutes(app, manager)
  registerPortalRoutes(app, manager)
  registerAppPortalRoutes(app, manager)

  return app
}
