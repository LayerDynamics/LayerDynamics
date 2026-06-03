import type { FastifyInstance } from 'fastify'
import httpProxy from '@fastify/http-proxy'
import type { AppPortalManager } from '../AppPortalManager'

/** Same-origin reverse proxy per registered dynamic app under /dynamic/:id/.
 *  Routing the guest through the provider's own origin is what makes a live,
 *  cross-origin app embeddable in an interactive iframe without tainting.
 *
 *  `allowedOrigin` (when set) replaces the guest's framing protections with an
 *  explicit, tight `frame-ancestors` so only the host origin may frame the
 *  proxied app — never a blanket "anyone can frame this". */
export function serveDynamic(
  app: FastifyInstance,
  manager: AppPortalManager,
  allowedOrigin?: string,
): void {
  for (const entry of manager.list()) {
    if (entry.serveStrategy !== 'dynamic' || !entry.upstream) continue
    app.register(httpProxy, {
      upstream: entry.upstream,
      prefix: `/dynamic/${entry.id}`,
      rewritePrefix: '/',
      http2: false,
      replyOptions: {
        rewriteHeaders: (headers: Record<string, string | string[] | undefined>) => {
          const h = { ...headers }
          // Drop the upstream's X-Frame-Options (it would block our embedding)…
          delete h['x-frame-options']
          // …and pin frame-ancestors to the host origin when known (tight), else
          // remove the upstream CSP so our own origin can frame it in dev.
          if (allowedOrigin) h['content-security-policy'] = `frame-ancestors ${allowedOrigin}`
          else delete h['content-security-policy']
          if (entry.headers) Object.assign(h, entry.headers)
          return h
        },
      },
    })
  }
}
