import { create } from 'zustand'
import type { PortalDataEntry } from '../../shared/contract'
import { PORTAL_DATA } from '../data/PortalData'

interface ConfigStore {
  providerOrigin: string
  apps: PortalDataEntry[]
  setProviderOrigin(origin: string): void
  /** Fetch the live registered-app list from the provider's /config endpoint. */
  load(origin: string): Promise<void>
}

export const useConfigStore = create<ConfigStore>((set) => ({
  providerOrigin: '',
  apps: PORTAL_DATA,
  setProviderOrigin: (providerOrigin) => set({ providerOrigin }),
  load: async (origin) => {
    set({ providerOrigin: origin })
    const res = await fetch(`${origin}/config`)
    if (!res.ok) return
    const body = (await res.json()) as { apps: PortalDataEntry[] }
    set({ apps: body.apps })
  },
}))
