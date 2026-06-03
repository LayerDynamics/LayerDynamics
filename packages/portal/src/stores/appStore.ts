import { create } from 'zustand'

export interface GuestRuntimeState {
  ready: boolean
  error: string | null
}

interface AppStore {
  guests: Record<string, GuestRuntimeState>
  setReady(appId: string, ready: boolean): void
  setError(appId: string, error: string | null): void
}

export const useAppStore = create<AppStore>((set) => ({
  guests: {},
  setReady: (appId, ready) =>
    set((st) => ({
      guests: { ...st.guests, [appId]: { ready, error: st.guests[appId]?.error ?? null } },
    })),
  setError: (appId, error) =>
    set((st) => ({
      guests: { ...st.guests, [appId]: { ready: st.guests[appId]?.ready ?? false, error } },
    })),
}))
