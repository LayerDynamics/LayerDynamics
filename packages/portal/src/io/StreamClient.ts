import { isStreamFrame, type ForwardedInput, type StreamFrameMeta } from '../../shared/contract'

export interface DecodedFrame {
  bitmap: ImageBitmap
  meta: StreamFrameMeta
}

/** WS consumer for a streamed guest. Pairs each JSON frame header with the binary
 *  blob that follows it, decodes to an ImageBitmap, and forwards input events back
 *  to the producer over the same socket. */
export class StreamClient {
  private ws: WebSocket | null = null
  private pendingMeta: StreamFrameMeta | null = null
  private readonly frameListeners = new Set<(f: DecodedFrame) => void>()
  private readonly url: string
  private readonly portalId: string

  constructor(url: string, portalId: string) {
    this.url = url
    this.portalId = portalId
  }

  connect(): void {
    const ws = new WebSocket(`${this.url}?role=consumer`)
    ws.binaryType = 'blob'
    ws.onmessage = (e) => {
      void this.handleMessage(e.data)
    }
    this.ws = ws
  }

  async handleMessage(data: unknown): Promise<void> {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data)
      if (isStreamFrame(parsed)) this.pendingMeta = parsed
      return
    }
    if (data instanceof Blob && this.pendingMeta) {
      const bitmap = await createImageBitmap(data)
      const meta = this.pendingMeta
      this.pendingMeta = null
      for (const l of this.frameListeners) l({ bitmap, meta })
    }
  }

  onFrame(l: (f: DecodedFrame) => void): () => void {
    this.frameListeners.add(l)
    return () => this.frameListeners.delete(l)
  }

  sendInput(event: ForwardedInput): void {
    this.ws?.send(JSON.stringify({ type: 'input', portalId: this.portalId, event }))
  }

  dispose(): void {
    this.ws?.close()
  }
}
