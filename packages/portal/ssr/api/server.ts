import { buildApp } from './app'
import { attachPortalSocket } from '../lib/Portal/PortalServer'

const PORT = Number(process.env.PORTAL_PORT ?? 5179)
const ALLOWED_ORIGIN = process.env.PORTAL_ALLOWED_ORIGIN

const app = buildApp({ allowedOrigin: ALLOWED_ORIGIN })

// WebSocket lifecycle channel shares the same HTTP server. Attach after the
// instance exists but it only binds once Fastify's server is listening.
await app.ready()
attachPortalSocket(app.server)

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then((addr) => console.log(`[portal] provider listening on ${addr}`))
  .catch((err) => {
    console.error('[portal] failed to start', err)
    process.exit(1)
  })
