import { create } from 'zustand'

/** The four immersive levels, in scroll order (SPEC-002). The hero IS the printer
 *  (printing the owner's name), so there is no separate standalone printing level. */
export type LevelId = 'hero' | 'processing' | 'otherWork' | 'hireMe'

/** Whether the active level is live or a transition is playing. */
export type Phase = 'live' | 'transition'

/** Direction of the in-flight transition. */
export type Direction = 'forward' | 'back'

/** How in-level scroll behaves (OQ-2): scrub an animation, or just advance. */
export type ScrollMode = 'scrub' | 'advance'

export interface LevelDef {
  id: LevelId
  scrollMode: ScrollMode
  /** Per-level camera framing consumed by LevelCamera (world units). `fitWidth`,
   *  when set, frames the camera head-on so a subject of that world-width fills
   *  the viewport WIDTH on any aspect ratio (overrides position.z). */
  camera: {
    position: [number, number, number]
    target: [number, number, number]
    fov: number
    /** Head-on framing: the camera is dollied so a subject this wide fills the
     *  viewport width. With `fitHeight` it instead CONTAINS that w×h box (fits
     *  whichever dimension is limiting) so nothing clips on any aspect. */
    fitWidth?: number
    fitHeight?: number
  }
  /** Transition accent shown when ENTERING this level (FR-16). */
  accent: string
}

/** World width the Ender 5's frame is scaled to (centred at the origin, head-on).
 *  The frame is ~square, so its scaled height ≈ width × FRAME_ASPECT; the printing
 *  camera CONTAINS that box so the whole frame — and the print head — is always
 *  visible (the cantilevered spool falls outside it, off-screen). */
export const PRINTER_FIT_WIDTH = 6
const FRAME_ASPECT = 1.15 // measured: full printer height (0.505) / frame width (0.44)
export const PRINTER_FIT_HEIGHT = PRINTER_FIT_WIDTH * FRAME_ASPECT

/**
 * Level registry — the single source of order + per-level framing. Adding a
 * level is a data edit here, not an orchestrator change. Cameras frame each
 * level's content (all authored around the origin) so only one need be live.
 */
export const LEVELS: LevelDef[] = [
  { id: 'hero', scrollMode: 'scrub', camera: { position: [0, 0, 9], target: [0, 0, 0], fov: 40, fitWidth: PRINTER_FIT_WIDTH, fitHeight: PRINTER_FIT_HEIGHT }, accent: '#c08a4a' },
  { id: 'processing', scrollMode: 'scrub', camera: { position: [0, 0, 9], target: [0, 0, 0], fov: 42 }, accent: '#5fd0d6' },
  { id: 'otherWork', scrollMode: 'advance', camera: { position: [0, 0, 12], target: [0, 0, 0], fov: 46 }, accent: '#8b7bd8' },
  { id: 'hireMe', scrollMode: 'advance', camera: { position: [0, 0, 9], target: [0, 0, 0], fov: 44 }, accent: '#5fd0d6' },
]

export const LEVEL_COUNT = LEVELS.length

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface LevelsState {
  /** Active level index into LEVELS. */
  index: number
  phase: Phase
  direction: Direction | null
  /** True while a transition plays — input that would change level is ignored. */
  locked: boolean
  /** Guards the mid-transition index swap so it happens exactly once. */
  swapped: boolean
  reducedMotion: boolean

  /** Request forward/back; no-op when locked or already at an end. */
  requestAdvance: () => void
  requestReverse: () => void
  /** Begin a transition in a direction (sets lock). */
  beginTransition: (dir: Direction) => void
  /** Apply the index change at the occluded midpoint (exactly once). */
  swap: () => void
  /** Finish: back to live, release lock. */
  endTransition: () => void
}

export const useLevels = create<LevelsState>((set, get) => ({
  index: 0,
  phase: 'live',
  direction: null,
  locked: false,
  swapped: false,
  reducedMotion: prefersReducedMotion,

  requestAdvance: () => {
    const s = get()
    if (s.locked || s.phase === 'transition') return
    if (s.index >= LEVEL_COUNT - 1) return
    s.beginTransition('forward')
  },
  requestReverse: () => {
    const s = get()
    if (s.locked || s.phase === 'transition') return
    if (s.index <= 0) return
    s.beginTransition('back')
  },
  beginTransition: (dir) =>
    set({ phase: 'transition', direction: dir, locked: true, swapped: false }),
  swap: () =>
    set((s) => {
      if (s.swapped || s.direction === null) return s
      const next = s.index + (s.direction === 'forward' ? 1 : -1)
      return { index: Math.max(0, Math.min(LEVEL_COUNT - 1, next)), swapped: true }
    }),
  endTransition: () => set({ phase: 'live', direction: null, locked: false, swapped: false }),
}))
