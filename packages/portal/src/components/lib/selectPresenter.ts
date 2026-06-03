import type { TransportDescriptor, PresenterKind } from '../../../shared/contract'

export type RenderChoice = PresenterKind | 'poster'

/** Resolve which presenter to render, honoring the negotiated transport and
 *  falling through to a guaranteed-renderable poster so a portal is never blank
 *  (FR-3, "always works no matter the situation"). */
export function selectPresenter(
  t: TransportDescriptor,
  health: { domWindowFailed?: boolean } = {},
): RenderChoice {
  if (t.transport === 'stencil' && t.native) return 'stencil'
  if (t.transport === 'texture' && t.streamEndpoint) return 'texture'
  if (t.transport === 'dom-window') {
    if (!health.domWindowFailed) return 'dom-window'
    if (t.streamEndpoint) return 'texture' // provider offered a stream fallback
    return 'poster'
  }
  return 'poster'
}
