import { buildApp } from './app'
import { attachPortalSocket } from '../lib/Portal/PortalServer'
import { attachStreamSocket } from '../lib/AppPortal/Stream/APSocketStream'
import { AppPortalManager } from '../lib/AppPortal/AppPortalManager'

// Railway (and most PaaS) inject $PORT; fall back to PORTAL_PORT then a dev default.
const PORT = Number(process.env.PORT ?? process.env.PORTAL_PORT ?? 5179)
const ALLOWED_ORIGIN = process.env.PORTAL_ALLOWED_ORIGIN

// One manager shared by the HTTP routes' lifecycle and both WS channels.
const manager = new AppPortalManager()
const app = buildApp({ allowedOrigin: ALLOWED_ORIGIN })

// Both WebSocket channels share the HTTP server: the lifecycle channel (/portal)
// and the frame stream (/stream). Each upgrade handler ignores non-matching paths.
await app.ready()
attachPortalSocket(app.server, manager)
attachStreamSocket(app.server, manager)

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then((addr) => console.log(`[portal] provider listening on ${addr}`))
  .catch((err) => {
    console.error('[portal] failed to start', err)
    process.exit(1)
  })
