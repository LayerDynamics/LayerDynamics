import type { ReactNode } from 'react'
import { useTrail, animated, config } from '@react-spring/web'
import {
  PROJECT_TYPES,
  type HireMeErrors,
  type HireMeField,
  type HireMeValues,
} from './types'

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface HireMeFormProps {
  values: HireMeValues
  errors: HireMeErrors
  /** True while a submission is in flight — disables inputs + button. */
  busy: boolean
  onChange: (field: HireMeField, value: string) => void
  onSubmit: () => void
}

/**
 * Presentational, fully controlled form. Holds no state and makes no decisions:
 * it renders the fields from `values`, surfaces `errors`, and reports edits +
 * submission up via callbacks. All logic lives in HireMeContainer. The fields
 * stagger in on mount via a react-spring trail (motion is a presentational
 * concern, so it lives here).
 */
export default function HireMeForm({ values, errors, busy, onChange, onSubmit }: HireMeFormProps) {
  // One row per visual field group; the trail reveals them in sequence.
  const rows: ReactNode[] = [
    <div className="hireme__field" key="name">
      <label className="hireme__label" htmlFor="hireme-name">
        Name
      </label>
      <input
        id="hireme-name"
        className="hireme__input"
        type="text"
        autoComplete="name"
        value={values.name}
        disabled={busy}
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? 'hireme-name-error' : undefined}
        onChange={(e) => onChange('name', e.target.value)}
      />
      {errors.name && (
        <p id="hireme-name-error" className="hireme__error">
          {errors.name}
        </p>
      )}
    </div>,

    <div className="hireme__field" key="email">
      <label className="hireme__label" htmlFor="hireme-email">
        Email
      </label>
      <input
        id="hireme-email"
        className="hireme__input"
        type="email"
        autoComplete="email"
        value={values.email}
        disabled={busy}
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'hireme-email-error' : undefined}
        onChange={(e) => onChange('email', e.target.value)}
      />
      {errors.email && (
        <p id="hireme-email-error" className="hireme__error">
          {errors.email}
        </p>
      )}
    </div>,

    <div className="hireme__row" key="row">
      <div className="hireme__field">
        <label className="hireme__label" htmlFor="hireme-type">
          Project type
        </label>
        <select
          id="hireme-type"
          className="hireme__input"
          value={values.projectType}
          disabled={busy}
          onChange={(e) => onChange('projectType', e.target.value)}
        >
          {PROJECT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="hireme__field">
        <label className="hireme__label" htmlFor="hireme-budget">
          Budget <span className="hireme__optional">(optional)</span>
        </label>
        <input
          id="hireme-budget"
          className="hireme__input"
          type="text"
          placeholder="e.g. $5k–15k, hourly, equity…"
          value={values.budget}
          disabled={busy}
          onChange={(e) => onChange('budget', e.target.value)}
        />
      </div>
    </div>,

    <div className="hireme__field" key="message">
      <label className="hireme__label" htmlFor="hireme-message">
        What are you building?
      </label>
      <textarea
        id="hireme-message"
        className="hireme__input hireme__textarea"
        rows={5}
        value={values.message}
        disabled={busy}
        aria-invalid={!!errors.message}
        aria-describedby={errors.message ? 'hireme-message-error' : undefined}
        onChange={(e) => onChange('message', e.target.value)}
      />
      {errors.message && (
        <p id="hireme-message-error" className="hireme__error">
          {errors.message}
        </p>
      )}
    </div>,

    <button type="submit" className="hireme__submit" disabled={busy} key="submit">
      {busy ? 'Sending…' : 'Send inquiry'}
    </button>,
  ]

  const trail = useTrail(rows.length, {
    from: { opacity: 0, y: 14 },
    to: { opacity: 1, y: 0 },
    config: config.gentle,
    immediate: prefersReducedMotion,
  })

  return (
    <form
      className="hireme__form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      {trail.map((style, i) => (
        <animated.div
          key={i}
          className="hireme__trail-item"
          style={{ opacity: style.opacity, transform: style.y.to((y) => `translateY(${y}px)`) }}
        >
          {rows[i]}
        </animated.div>
      ))}
    </form>
  )
}
