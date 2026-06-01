import { useEffect, useRef, useState } from 'react'
import { useLevels, LEVELS } from '../stores/useLevels'

/** Fixed transition duration (ms) — identical on every screen and frame rate. */
const DURATION = 900

/**
 * DOM-side transition driver + curtain. When a transition begins it runs a
 * wall-clock-timed (requestAnimationFrame) fade: a full-viewport opaque curtain
 * rises to fully occlude the canvas, the level index is swapped at the occluded
 * midpoint, then the curtain falls to reveal the new level. Because the swap
 * happens while the curtain is opaque, no two levels are ever visible at once,
 * and the duration is independent of fps/aspect (FR-3/FR-4). Reduced-motion does
 * an instant cut.
 */
export default function LevelTransitions() {
  const phase = useLevels((s) => s.phase)
  const direction = useLevels((s) => s.direction)
  const index = useLevels((s) => s.index)
  const reducedMotion = useLevels((s) => s.reducedMotion)
  const swap = useLevels((s) => s.swap)
  const endTransition = useLevels((s) => s.endTransition)
  const [cover, setCover] = useState(0)
  const rafRef = useRef(0)

  // Accent of the level being entered (forward → next; back → prev).
  const enteringIndex =
    phase === 'transition' && direction
      ? Math.max(0, Math.min(LEVELS.length - 1, index + (direction === 'forward' ? 1 : -1)))
      : index
  const accent = LEVELS[enteringIndex].accent

  useEffect(() => {
    if (phase !== 'transition') return
    if (reducedMotion) {
      swap()
      endTransition()
      return
    }
    let start: number | undefined
    let swapped = false
    const tick = (ts: number) => {
      if (start === undefined) start = ts
      const t = Math.min(1, (ts - start) / DURATION)
      // Triangle: 0 → 1 at the midpoint (fully occluded) → 0.
      setCover(t < 0.5 ? t / 0.5 : (1 - t) / 0.5)
      if (t >= 0.5 && !swapped) {
        swapped = true
        swap()
      }
      if (t >= 1) {
        setCover(0)
        endTransition()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase, reducedMotion, swap, endTransition])

  return (
    <div
      className="level-curtain"
      aria-hidden
      style={{
        opacity: cover,
        background: `radial-gradient(circle at 50% 45%, ${accent}22, var(--bg0, #0a0912) 70%)`,
        pointerEvents: phase === 'transition' ? 'auto' : 'none',
      }}
    />
  )
}
