import { create } from 'zustand'
import type { PortalState, TransportDescriptor } from '../../shared/contract'
import { nextOnEvent, type LifecycleEvent } from '../lib/lifecycle'
import { pickDemotions } from '../lib/liveCap'

export interface ScreenQuad {
  x: number
  y: number
  w: number
  h: number
  visible: boolean
}

export interface PortalInstance {
  id: string
  appId: string
  state: PortalState
  engaged: boolean
  transport: TransportDescriptor | null
  quad: ScreenQuad | null
  /** Timestamp (ms) when this portal last entered `live` — drives MAX_LIVE LRU. */
  lastEngagedAt: number
}

interface PortalStore {
  portals: Record<string, PortalInstance>
  register(id: string, appId: string): void
  /** Apply a lifecycle event through the state machine; illegal/no-op events are
   *  ignored. Stamps lastEngagedAt when entering `live`. */
  transition(id: string, event: LifecycleEvent, now?: number): void
  setState(id: string, state: PortalState): void
  setTransport(id: string, t: TransportDescriptor): void
  setQuad(id: string, quad: ScreenQuad): void
  setEngaged(id: string, engaged: boolean): void
  remove(id: string): void
  reset(): void
}

const patch = (
  st: { portals: Record<string, PortalInstance> },
  id: string,
  fields: Partial<PortalInstance>,
) =>
  st.portals[id]
    ? { portals: { ...st.portals, [id]: { ...st.portals[id], ...fields } } }
    : st

export const usePortalStore = create<PortalStore>((set) => ({
  portals: {},
  register: (id, appId) =>
    set((st) => ({
      portals: {
        ...st.portals,
        [id]: {
          id,
          appId,
          state: 'dormant',
          engaged: false,
          transport: null,
          quad: null,
          lastEngagedAt: 0,
        },
      },
    })),
  transition: (id, event, now = performance.now()) =>
    set((st) => {
      const p = st.portals[id]
      if (!p) return st
      const next = nextOnEvent(p.state, event)
      if (next === p.state) return st

      const portals = {
        ...st.portals,
        [id]: {
          ...p,
          state: next,
          engaged: next === 'live',
          lastEngagedAt: next === 'live' ? now : p.lastEngagedAt,
        },
      }

      // Enforce MAX_LIVE: when this portal goes live, demote the least-recently-
      // engaged live portals to idle so at most MAX_LIVE guests run at once.
      if (next === 'live') {
        const liveRefs = Object.values(portals)
          .filter((q) => q.state === 'live')
          .map((q) => ({ id: q.id, lastEngagedAt: q.lastEngagedAt }))
        for (const demoteId of pickDemotions(liveRefs)) {
          const d = portals[demoteId]
          portals[demoteId] = { ...d, state: 'idle', engaged: false }
        }
      }

      return { portals }
    }),
  setState: (id, state) => set((st) => patch(st, id, { state })),
  setTransport: (id, transport) => set((st) => patch(st, id, { transport })),
  setQuad: (id, quad) => set((st) => patch(st, id, { quad })),
  setEngaged: (id, engaged) => set((st) => patch(st, id, { engaged })),
  remove: (id) =>
    set((st) => {
      const portals = { ...st.portals }
      delete portals[id]
      return { portals }
    }),
  reset: () => set({ portals: {} }),
}))
