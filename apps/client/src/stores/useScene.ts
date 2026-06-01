import { create } from 'zustand'

/** Landing sections in scroll order. */
export type Section = 'hero' | 'process' | 'collection' | 'contact'

/** How the project collection is organized. */
export type Lens = 'tier' | 'domain'

interface SceneState {
  /** True once the landing scene has mounted/loaded and the loader can clear. */
  ready: boolean
  /** Which landing section the camera is currently parked in. */
  section: Section
  /** id of the project card under the pointer, or null. */
  hovered: string | null
  /** Active organizing lens for the project collection. */
  lens: Lens
  /** World-space Y of the Contact section, computed from the active grouping's
   *  height so the camera travel and footer adapt to tier vs. domain counts. */
  contactY: number
  /** Cached OS reduced-motion preference; the camera rig snaps instead of damps. */
  reducedMotion: boolean
  setReady: (v: boolean) => void
  setSection: (s: Section) => void
  setHovered: (id: string | null) => void
  setLens: (l: Lens) => void
  setContactY: (y: number) => void
}

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useScene = create<SceneState>((set) => ({
  ready: false,
  section: 'hero',
  hovered: null,
  lens: 'tier',
  contactY: -22,
  reducedMotion: prefersReducedMotion,
  setReady: (v) => set((st) => (st.ready === v ? st : { ready: v })),
  setSection: (s) => set((st) => (st.section === s ? st : { section: s })),
  setHovered: (id) => set((st) => (st.hovered === id ? st : { hovered: id })),
  setLens: (l) => set((st) => (st.lens === l ? st : { lens: l })),
  setContactY: (y) => set((st) => (st.contactY === y ? st : { contactY: y })),
}))
