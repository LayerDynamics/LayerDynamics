import type { ReactNode } from 'react'
import { useSpring, useTransition, animated, config, type SpringValue } from '@react-spring/web'
import type { SubmitStatus } from './types'

// Honor the OS reduced-motion preference: springs resolve instantly instead of
// animating. Evaluated once at module load (matches the store's approach).
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface HireMeLayoutProps {
  eyebrow: string
  title: string
  intro: string
  status: SubmitStatus
  /** Shown when a submission fails. */
  errorMessage?: string
  /** Resets back to the form after a successful send. */
  onReset: () => void
  /** The form (or any body content) — rendered while not in the "sent" state. */
  children: ReactNode
}

/** Map a {opacity, y} spring to a CSS style object (fade + vertical rise). */
const rise = (s: { opacity: SpringValue<number>; y: SpringValue<number> }) => ({
  opacity: s.opacity,
  transform: s.y.to((y) => `translateY(${y}px)`),
})

/**
 * Presentational shell for the feature: the section frame, header copy, and the
 * glass panel that holds the body. It owns no logic — but it does own the
 * feature's *motion* (a presentational concern), driven by react-spring: the
 * header + panel rise in on mount, the body cross-fades between the form and the
 * success confirmation, and the error banner slides in/out.
 */
export default function HireMeLayout({
  eyebrow,
  title,
  intro,
  status,
  errorMessage,
  onReset,
  children,
}: HireMeLayoutProps) {
  // Staggered entrance: header first, panel just behind it.
  const headerSpring = useSpring({
    from: { opacity: 0, y: 24 },
    to: { opacity: 1, y: 0 },
    config: config.gentle,
    immediate: prefersReducedMotion,
  })
  const panelSpring = useSpring({
    from: { opacity: 0, y: 28 },
    to: { opacity: 1, y: 0 },
    delay: prefersReducedMotion ? 0 : 120,
    config: config.gentle,
    immediate: prefersReducedMotion,
  })

  // Cross-fade the panel body between the form and the success confirmation.
  const bodyTransition = useTransition(status === 'sent', {
    from: { opacity: 0, y: 16 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: -16 },
    config: config.gentle,
    exitBeforeEnter: true,
    immediate: prefersReducedMotion,
  })

  // Error banner slides in only when a submission fails.
  const showError = status === 'error' && !!errorMessage
  const errorTransition = useTransition(showError, {
    from: { opacity: 0, y: -8 },
    enter: { opacity: 1, y: 0 },
    leave: { opacity: 0, y: -8 },
    config: config.stiff,
    immediate: prefersReducedMotion,
  })

  return (
    <section className="hireme" aria-labelledby="hireme-title">
      <animated.header className="hireme__header" style={rise(headerSpring)}>
        <p className="hireme__eyebrow">{eyebrow}</p>
        <h1 id="hireme-title" className="hireme__title">
          {title}
        </h1>
        <p className="hireme__intro">{intro}</p>
      </animated.header>

      <animated.div className="hireme__panel" style={rise(panelSpring)}>
        {errorTransition((style, show) =>
          show ? (
            <animated.p className="hireme__banner" role="alert" style={rise(style)}>
              {errorMessage}
            </animated.p>
          ) : null,
        )}

        {bodyTransition((style, sent) =>
          sent ? (
            <animated.div className="hireme__swap hireme__success" style={rise(style)} role="status">
              <h2 className="hireme__success-title">Message ready to send</h2>
              <p className="hireme__success-body">
                Thanks — your inquiry is on its way. I'll get back to you at the email you provided.
              </p>
              <button type="button" className="hireme__reset" onClick={onReset}>
                Send another
              </button>
            </animated.div>
          ) : (
            <animated.div className="hireme__swap" style={rise(style)}>
              {children}
            </animated.div>
          ),
        )}
      </animated.div>
    </section>
  )
}
