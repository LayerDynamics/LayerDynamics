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
 * level is a data edit here, not an orchestrator change.
 *
 * EVERY level frames its content with `fitWidth` + `fitHeight` (the CONTAIN path
 * in LevelCamera): the camera dollies so the level's content box fits whichever
 * dimension is limiting on the current aspect. On a wide desktop that's a
 * height-fit; on a narrow phone it becomes a width-fit, so the content fills the
 * screen instead of shrinking into the middle. The boxes are each level's
 * measured content extent (NOT a loose desktop frame) so the subject stays
 * legible on mobile — the same reason the printer fills the screen.
 */
export const LEVELS: LevelDef[] = [
  // Printer frame: ~square, contained so the whole rig + print head stay on screen.
  { id: 'hero', scrollMode: 'scrub', camera: { position: [0, 0, 9], target: [0, 0, 0], fov: 40, fitWidth: PRINTER_FIT_WIDTH, fitHeight: PRINTER_FIT_HEIGHT }, accent: '#ff6750' },
  // Point-cloud logo normalized to radius 1.55, expands under variation → ~5.6 box.
  { id: 'processing', scrollMode: 'scrub', camera: { position: [0, 0, 9], target: [0, 0, 0], fov: 42, fitWidth: 5.6, fitHeight: 5.6 }, accent: '#ff9d8a' },
  // Project grid: 4 cols ≈ 12 wide; VIEW_SPAN 9.5 visible tall (see OtherWorkLevel).
  { id: 'otherWork', scrollMode: 'advance', camera: { position: [0, 0, 12], target: [0, 0, 0], fov: 46, fitWidth: 12.6, fitHeight: 9.5 }, accent: '#ffffff' },
  // Contact block: maxWidth 8.5 text, headline→links span ≈ 6.6 tall, centred ~−0.4.
  { id: 'hireMe', scrollMode: 'advance', camera: { position: [0, -0.4, 9], target: [0, -0.4, 0], fov: 44, fitWidth: 9, fitHeight: 6.6 }, accent: '#ff6750' },
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
