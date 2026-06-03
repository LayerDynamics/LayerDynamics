import { WebSocketServer, type WebSocket } from 'ws'
import type { Server } from 'node:http'
import type { AppPortalManager } from '../../AppPortal/AppPortalManager'

interface Room {
  producers: Set<WebSocket>
  consumers: Set<WebSocket>
}

/** WS frame relay for streamed guests. A streamed app connects as a `producer`
 *  and pushes frames (JSON header + binary bitmap); hosts connect as `consumer`s
 *  and receive them, and forward input events back to producers. One room per
 *  registered appId; unregistered ids are refused (allowlist). */
export function attachStreamSocket(
  server: Server,
  manager: AppPortalManager,
): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true })
  const rooms = new Map<string, Room>()

  const room = (appId: string): Room => {
    let r = rooms.get(appId)
    if (!r) {
      r = { producers: new Set(), consumers: new Set() }
      rooms.set(appId, r)
    }
    return r
  }

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    const m = /^\/stream\/([^/]+)$/.exec(url.pathname)
    if (!m) return // not a stream upgrade — leave for other handlers (e.g. /portal)
    const appId = m[1]
    const role = url.searchParams.get('role') ?? 'consumer'
    wss.handleUpgrade(req, socket, head, (ws) => {
      if (!manager.has(appId)) {
        ws.close(1008, 'unregistered app')
        return
      }
      join(ws, room(appId), role)
    })
  })

  return wss
}

function join(ws: WebSocket, r: Room, role: string): void {
  const set = role === 'producer' ? r.producers : r.consumers
  set.add(ws)
  ws.on('close', () => set.delete(ws))
  if (role === 'producer') {
    // Producer → all consumers (frame headers + binary blobs).
    ws.on('message', (data, isBinary) => {
      for (const c of r.consumers) if (c.readyState === c.OPEN) c.send(data, { binary: isBinary })
    })
  } else {
    // Consumer → all producers (forwarded input events).
    ws.on('message', (data) => {
      for (const p of r.producers) if (p.readyState === p.OPEN) p.send(data)
    })
  }
}
