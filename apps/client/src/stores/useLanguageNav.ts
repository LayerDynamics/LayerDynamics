import { create } from 'zustand'
import type { LanguageId } from '../data/languages'

/**
 * Bridges the in-Canvas language-logo click to the DOM router. zustand state
 * crosses the R3F Canvas boundary cleanly — no router context inside the Canvas
 * (same rule as usePortalOverlay / the project-card onOpen callback). The in-Canvas
 * `LanguageLogo` sets `pending`; the DOM `LanguageNavBridge` (a Canvas sibling that
 * owns router hooks) navigates to /languages/:id and then clears it via `consume`.
 */
interface LanguageNavState {
  /** Language id awaiting navigation, or null when idle. */
  pending: LanguageId | null
  /** Request navigation to a language page (called from inside the Canvas). */
  open: (id: LanguageId) => void
  /** Clear the pending request after the DOM side has navigated. */
  consume: () => void
}

export const useLanguageNav = create<LanguageNavState>((set) => ({
  pending: null,
  open: (pending) => set({ pending }),
  consume: () => set({ pending: null }),
}))
