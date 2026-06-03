import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { registerConfigRoute } from './routes/Config'
import { registerInquiryRoute } from './routes/Inquiry'
import { registerStaticRoutes } from './routes/Static'
import { registerDynamicRoutes } from './routes/Dynamic'
import { registerPortalRoutes } from './routes/Portal'
import { registerAppPortalRoutes } from './routes/AppPortal'
import { registerStreamRoutes } from './routes/Stream'
import { AppPortalManager } from '../lib/AppPortal/AppPortalManager'

export interface BuildAppOptions {
  /** Origin allowed to frame/embed the provider. Tightened in M4; permissive in dev. */
  allowedOrigin?: string
}

/** Compose the provider Fastify instance. Importable by tests (app.inject) and by
 *  server.ts (which adds the WebSocket channels and listens). */
export function buildApp(opts: BuildAppOptions = {}): FastifyInstance {
  // trustProxy: in production the provider sits behind Railway's edge proxy, so
  // without this `req.ip` would be the proxy address and per-IP rate limiting on
  // /api/inquiry would collapse into one shared global bucket. Trusting the proxy
  // makes `req.ip` resolve to the real client (via X-Forwarded-For). In tests
  // (app.inject) and local dev there's no upstream proxy, so it's a safe default.
  const app = Fastify({ logger: false, trustProxy: true })
  const manager = new AppPortalManager()

  // Restrict CORS to the embedding host origin when known; permissive in dev.
  // M4 adds CSP frame-ancestors on served/proxied responses on top of this.
  app.register(cors, { origin: opts.allowedOrigin ?? true, credentials: false })

  // When the host origin is known, pin frame-ancestors on every response so only
  // that origin may frame the provider (and the apps it serves). Proxied dynamic
  // responses set their own frame-ancestors in APDynamicServe.
  if (opts.allowedOrigin) {
    const csp = `frame-ancestors ${opts.allowedOrigin}`
    app.addHook('onSend', async (_req, reply, payload) => {
      reply.header('Content-Security-Policy', csp)
      return payload
    })
  }

  app.get('/healthz', async () => ({ ok: true }))

  registerInquiryRoute(app)
  registerConfigRoute(app, manager)
  registerStaticRoutes(app, manager)
  registerDynamicRoutes(app, manager, opts.allowedOrigin)
  registerPortalRoutes(app, manager)
  registerAppPortalRoutes(app, manager)
  registerStreamRoutes(app, manager)

  return app
}
