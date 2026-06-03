import { create } from 'zustand'

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

interface ConnectorStore {
  status: Record<string, ConnectionStatus>
  setStatus(portalId: string, status: ConnectionStatus): void
  clear(portalId: string): void
}

export const useConnectorStore = create<ConnectorStore>((set) => ({
  status: {},
  setStatus: (portalId, status) =>
    set((st) => ({ status: { ...st.status, [portalId]: status } })),
  clear: (portalId) =>
    set((st) => {
      const status = { ...st.status }
      delete status[portalId]
      return { status }
    }),
}))
