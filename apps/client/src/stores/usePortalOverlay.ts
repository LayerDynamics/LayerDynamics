import { create } from 'zustand'

/**
 * Bridges the in-Canvas portal element (which captures the click) to the DOM
 * PortalOverlay (a Canvas sibling that shows the live site). zustand state crosses
 * the R3F Canvas boundary cleanly — no prop-drilling, no router context inside the
 * Canvas (same rule as the project-card onOpen callback).
 */
interface PortalOverlayState {
  /** Registered app id currently shown in the overlay, or null when closed. */
  openApp: string | null
  /** Provider origin to negotiate the site URL against. */
  providerOrigin: string | null
  open: (app: string, providerOrigin: string) => void
  close: () => void
}

export const usePortalOverlay = create<PortalOverlayState>((set) => ({
  openApp: null,
  providerOrigin: null,
  open: (openApp, providerOrigin) => set({ openApp, providerOrigin }),
  close: () => set({ openApp: null, providerOrigin: null }),
}))
