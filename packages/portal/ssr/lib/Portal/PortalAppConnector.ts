import type { AppPortalManager } from '../AppPortal/AppPortalManager'
import { ROUTES, type TransportDescriptor } from '../../../shared/contract'

/** Maps a registered app's kind to a concrete, working TransportDescriptor.
 *  Returns null for unregistered ids — allowlist enforcement at negotiation time.
 *  This is the "always works no matter the situation" decision point: each kind
 *  resolves to a presenter the host knows how to render. */
export function negotiateTransport(
  manager: AppPortalManager,
  appId: string,
): TransportDescriptor | null {
  const app = manager.get(appId)
  if (!app) return null
  switch (app.serveStrategy) {
    case 'static':
      return { transport: 'dom-window', url: `${ROUTES.static(appId)}/`, sandbox: app.sandbox, dims: pxDims(app.defaultSize) }
    case 'dynamic':
      return { transport: 'dom-window', url: `${ROUTES.dynamic(appId)}/`, sandbox: app.sandbox, dims: pxDims(app.defaultSize) }
    case 'direct':
      // Embed the framing-permissive app at its own origin — no proxy, so its
      // absolute asset paths resolve against its real host (a path-prefix proxy
      // would break them). Cross-origin iframes are fully interactive; only
      // pixel-readback (texture) is blocked, which dom-window doesn't use.
      return { transport: 'dom-window', url: app.origin, sandbox: app.sandbox, dims: pxDims(app.defaultSize) }
    case 'stream':
      return { transport: 'texture', streamEndpoint: ROUTES.stream(appId), dims: pxDims(app.defaultSize) }
    case 'native':
      return { transport: 'stencil', native: true, dims: pxDims(app.defaultSize) }
  }
}

function pxDims([w, h]: [number, number]): [number, number] {
  // World units → a sensible intrinsic pixel size (~426 px per world unit).
  return [Math.round(w * 426), Math.round(h * 426)]
}
