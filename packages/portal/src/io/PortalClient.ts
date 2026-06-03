import { isPortalMessage, type PortalMessage } from '../../shared/contract'

type Listener = (msg: PortalMessage) => void

/** Host→provider control channel over WebSocket, with exponential-backoff
 *  reconnect. Carries lifecycle signals (warm/engaged/idle/dispose) and receives
 *  state/error messages from the provider. */
export class PortalClient {
  private ws: WebSocket | null = null
  private readonly listeners = new Set<Listener>()
  private backoff = 250
  private disposed = false
  private readonly providerOrigin: string
  private readonly portalId: string

  constructor(providerOrigin: string, portalId: string) {
    this.providerOrigin = providerOrigin
    this.portalId = portalId
  }

  connect(): void {
    if (this.disposed) return
    const wsUrl =
      this.providerOrigin.replace(/^http/, 'ws') + `/portal/${this.portalId}`
    const ws = new WebSocket(wsUrl)
    this.ws = ws
    ws.onopen = () => {
      this.backoff = 250
    }
    ws.onmessage = (e) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(e.data as string)
      } catch {
        return
      }
      if (isPortalMessage(parsed)) for (const l of this.listeners) l(parsed)
    }
    ws.onclose = () => {
      if (this.disposed) return
      this.backoff = Math.min(this.backoff * 2, 5000)
      setTimeout(() => this.connect(), this.backoff)
    }
  }

  send(msg: PortalMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg))
  }

  on(l: Listener): () => void {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  dispose(): void {
    this.disposed = true
    this.ws?.close()
  }
}
