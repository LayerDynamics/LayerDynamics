import { useEffect, useState } from 'react'

/**
 * One-time onboarding cue: a downward chevron stack ("VVV") that nudges the
 * visitor to scroll into the first level. It removes itself the instant ANY
 * scroll-like input occurs — wheel, touch-drag, or an Arrow/Page/Space key — and
 * never returns, so it only ever shows before the very first scroll. It owns its
 * own one-shot listeners (decoupled from LevelInput) and renders nothing into the
 * Canvas. Stays mounted-but-hidden after dismissal so the fade-out can play; the
 * dismissal is permanent for the session.
 */
export default function ScrollHint() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return
    const dismiss = () => setDismissed(true)
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'ArrowUp', 'PageUp'].includes(e.key)) dismiss()
    }
    window.addEventListener('wheel', dismiss, { passive: true, once: true })
    window.addEventListener('touchmove', dismiss, { passive: true, once: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', dismiss)
      window.removeEventListener('touchmove', dismiss)
      window.removeEventListener('keydown', onKey)
    }
  }, [dismissed])

  return (
    <div className={`scroll-hint${dismissed ? ' scroll-hint--hidden' : ''}`} aria-hidden>
      <span className="scroll-hint__label">Scroll</span>
      <span className="scroll-hint__chevrons">
        {[0, 1, 2].map((i) => (
          <svg key={i} viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 2 L12 10 L22 2" />
          </svg>
        ))}
      </span>
    </div>
  )
}
