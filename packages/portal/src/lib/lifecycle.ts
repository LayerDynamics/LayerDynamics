import type { PortalState } from '../../shared/contract'

export type LifecycleEvent =
  | 'engage'
  | 'ready'
  | 'disengage'
  | 'offscreen'
  | 'onscreen'
  | 'dispose'

const LEGAL: Record<PortalState, PortalState[]> = {
  dormant: ['warming'],
  warming: ['live', 'idle', 'dormant'],
  live: ['idle'],
  idle: ['live', 'warming', 'dormant'],
}

/** True iff `to` is a legal next state from `from`. The engagement-gated machine
 *  forbids skipping (e.g. dormant→live) so a guest only runs after warming. */
export function canTransition(from: PortalState, to: PortalState): boolean {
  return LEGAL[from].includes(to)
}

const EVENT_MAP: Record<PortalState, Partial<Record<LifecycleEvent, PortalState>>> = {
  dormant: { engage: 'warming' },
  warming: { ready: 'live', disengage: 'dormant', offscreen: 'dormant' },
  live: { disengage: 'idle', offscreen: 'idle' },
  idle: { engage: 'live', onscreen: 'live', offscreen: 'dormant' },
}

/** Resolve the next state for an event, or the current state if it's a no-op. */
export function nextOnEvent(state: PortalState, event: LifecycleEvent): PortalState {
  return EVENT_MAP[state][event] ?? state
}
