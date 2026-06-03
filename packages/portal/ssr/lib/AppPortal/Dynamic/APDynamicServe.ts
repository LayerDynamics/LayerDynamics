import type { FastifyInstance } from 'fastify'
import httpProxy from '@fastify/http-proxy'
import type { AppPortalManager } from '../AppPortalManager'

/** Same-origin reverse proxy per registered dynamic app under /dynamic/:id/.
 *  Routing the guest through the provider's own origin is what makes a live,
 *  cross-origin app embeddable in an interactive iframe without tainting. */
export function serveDynamic(app: FastifyInstance, manager: AppPortalManager): void {
  for (const entry of manager.list()) {
    if (entry.serveStrategy !== 'dynamic' || !entry.upstream) continue
    app.register(httpProxy, {
      upstream: entry.upstream,
      prefix: `/dynamic/${entry.id}`,
      rewritePrefix: '/',
      http2: false,
      replyOptions: {
        // Strip the guest's framing protections so OUR origin may embed it.
        // Only allowlisted origins ever reach this path. M4 replaces the bare
        // strip with an explicit tight frame-ancestors directive.
        rewriteHeaders: (headers: Record<string, string | string[] | undefined>) => {
          const h = { ...headers }
          delete h['x-frame-options']
          delete h['content-security-policy']
          if (entry.headers) Object.assign(h, entry.headers)
          return h
        },
      },
    })
  }
}
