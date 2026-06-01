import { useEffect } from 'react'
import { useLevels } from '../stores/useLevels'
import { scrollProgress, setScroll } from '../stores/levelScroll'

/**
 * Captures advance/reverse intent from wheel, touch, and keyboard and drives the
 * shared in-level `scrollProgress` (0..1). Filling progress to 1 with continued
 * forward intent arms `requestAdvance`; emptying to 0 with back intent arms
 * `requestReverse`. Intent is accumulated (not raw-applied) and ignored while a
 * transition is locked, so a violent fling advances exactly one level and can
 * never skip or reveal two. Renders nothing — pure DOM side-effects into the
 * store + the cross-Canvas ref.
 */
const WHEEL_SENS = 1 / 900   // ~one firm wheel gesture fills a level
const TOUCH_SENS = 1 / 420
const KEY_STEP = 0.34
// Minimum wall-clock gap between level changes. Independent of the transition
// duration so a level can never be skipped even when transitions are instant
// (reduced-motion): a single fling advances exactly one level.
const CHANGE_COOLDOWN = 650

export default function LevelInput() {
  useEffect(() => {
    let touchY: number | null = null
    let lastChange = 0

    const change = (advance: boolean) => {
      const now = performance.now()
      if (now - lastChange < CHANGE_COOLDOWN) return
      lastChange = now
      const s = useLevels.getState()
      if (advance) s.requestAdvance()
      else s.requestReverse()
    }

    const apply = (deltaForward: number) => {
      const s = useLevels.getState()
      if (s.locked || s.phase === 'transition') return
      const before = scrollProgress.current
      const next = before + deltaForward
      if (deltaForward > 0 && before >= 1 - 1e-3) {
        change(true)
        return
      }
      if (deltaForward < 0 && before <= 1e-3) {
        change(false)
        return
      }
      setScroll(next)
    }

    const onWheel = (e: WheelEvent) => {
      apply(e.deltaY * WHEEL_SENS)
    }
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null
    }
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return
      const y = e.touches[0]?.clientY ?? touchY
      apply((touchY - y) * TOUCH_SENS)
      touchY = y
    }
    const onTouchEnd = () => {
      touchY = null
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        apply(KEY_STEP)
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        apply(-KEY_STEP)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)

    // Reset in-level progress whenever the active level changes: enter at the
    // start when arriving forward, at the end when arriving via reverse.
    const unsub = useLevels.subscribe((state, prev) => {
      if (state.index !== prev.index) {
        scrollProgress.current = prev.index < state.index ? 0 : 1
      }
    })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
      unsub()
    }
  }, [])

  return null
}
