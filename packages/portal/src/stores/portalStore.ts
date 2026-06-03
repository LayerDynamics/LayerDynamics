import { create } from 'zustand'
import type { PortalState, TransportDescriptor } from '../../shared/contract'

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
}

interface PortalStore {
  portals: Record<string, PortalInstance>
  register(id: string, appId: string): void
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
        [id]: { id, appId, state: 'dormant', engaged: false, transport: null, quad: null },
      },
    })),
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
