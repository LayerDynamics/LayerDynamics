import { WebSocketServer, type WebSocket } from 'ws'
import type { Server } from 'node:http'
import { isPortalMessage, type PortalMessage } from '../../../shared/contract'
import { AppPortalManager } from '../AppPortal/AppPortalManager'
import { negotiateTransport } from './PortalAppConnector'
import { PortalDisplay } from './PortalDisplay'

/** Host↔provider lifecycle channel. Negotiation itself is HTTP (routes/Portal.ts);
 *  this socket carries warm/engaged/idle/dispose and emits state/error back.
 *
 *  Uses noServer + a path-filtered upgrade handler so other sockets (the M3 frame
 *  stream on /stream/) can attach their own upgrade handlers to the same server. */
export function attachPortalSocket(
  server: Server,
  manager: AppPortalManager = new AppPortalManager(),
): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true })
  const sessions = new Map<string, PortalDisplay>()

  server.on('upgrade', (req, socket, head) => {
    const path = (req.url ?? '').split('?')[0]
    if (!path.startsWith('/portal/')) return // not ours — let another handler take it
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
  })

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (raw) => handle(ws, raw.toString(), manager, sessions))
    ws.on('close', () => {
      for (const [id, d] of sessions) if (d.state !== 'dormant') sessions.delete(id)
    })
  })

  return wss
}

function handle(
  ws: WebSocket,
  raw: string,
  manager: AppPortalManager,
  sessions: Map<string, PortalDisplay>,
): void {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return
  }
  if (!isPortalMessage(parsed)) return // drop malformed / off-protocol (security)
  const msg = parsed as PortalMessage

  switch (msg.type) {
    case 'warm': {
      const transport = negotiateTransport(manager, msg.appId)
      if (!transport) {
        send(ws, { type: 'error', portalId: msg.portalId, message: 'unregistered app' })
        return
      }
      // Acquire/resume the guest runtime and mark it running (enforces the cap,
      // suspending the least-recently-engaged guest if over MAX_LIVE).
      manager.warm(msg.appId)
      manager.markRunning(msg.appId)
      const display = sessions.get(msg.portalId) ?? new PortalDisplay(msg.portalId, msg.appId)
      display.setTransport(transport)
      display.setState('live')
      sessions.set(msg.portalId, display)
      send(ws, { type: 'state', portalId: msg.portalId, state: 'live' })
      break
    }
    case 'engaged': {
      sessions.get(msg.portalId)?.setState('live')
      send(ws, { type: 'state', portalId: msg.portalId, state: 'live' })
      break
    }
    case 'idle': {
      const display = sessions.get(msg.portalId)
      display?.setState('idle')
      // Release the guest's compute (the engagement-gated contract).
      if (display) manager.suspend(display.appId)
      send(ws, { type: 'state', portalId: msg.portalId, state: 'idle' })
      break
    }
    case 'dispose': {
      const display = sessions.get(msg.portalId)
      if (display) manager.dispose(display.appId)
      sessions.delete(msg.portalId)
      break
    }
    default:
      break // 'input' handled in M3; negotiate/state/error are host-bound
  }
}

function send(ws: WebSocket, msg: PortalMessage): void {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
}
