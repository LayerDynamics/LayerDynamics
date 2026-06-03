/** Host-side handle to one windowed guest iframe. Typed, origin-checked
 *  postMessage so host↔guest traffic can't be spoofed by another origin. */
export class AppClient {
  private readonly frame: HTMLIFrameElement
  private readonly guestOrigin: string

  constructor(frame: HTMLIFrameElement, guestOrigin: string) {
    this.frame = frame
    this.guestOrigin = guestOrigin
  }

  post(message: unknown): void {
    this.frame.contentWindow?.postMessage(message, this.guestOrigin)
  }

  onMessage(handler: (data: unknown) => void): () => void {
    const fn = (e: MessageEvent) => {
      if (e.origin === this.guestOrigin) handler(e.data)
    }
    window.addEventListener('message', fn)
    return () => window.removeEventListener('message', fn)
  }
}
