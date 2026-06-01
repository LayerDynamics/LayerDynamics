/**
 * Cross-Canvas scroll bridge. A plain module-singleton ref (not zustand) so the
 * per-frame writer (LevelInput, DOM side) and readers (level components inside
 * the Canvas) share one value without triggering React re-renders. `current` is
 * the active level's 0..1 in-level progress; it resets on every level change.
 */
export const scrollProgress: { current: number } = { current: 0 }

export function setScroll(v: number): void {
  scrollProgress.current = v < 0 ? 0 : v > 1 ? 1 : v
}
