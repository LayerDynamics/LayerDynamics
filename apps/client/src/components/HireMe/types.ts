// Shared types + constants for the HireMe feature. Kept in one module so the
// container (logic), the form (presentation), and any consumer all agree on the
// same shapes — the single source of truth for the feature's data.

export type ProjectType = 'new-build' | 'consulting' | 'collaboration' | 'other'

export interface HireMeValues {
  name: string
  email: string
  projectType: ProjectType
  budget: string
  message: string
}

export type HireMeField = keyof HireMeValues

/** Per-field validation messages; a field is absent when it's valid. */
export type HireMeErrors = Partial<Record<HireMeField, string>>

/** Lifecycle of a submission.
 *  - `sent`   — delivered to a configured channel (Web3Forms / Discord). Confirmed.
 *  - `mailto` — no channel configured, so we only opened a prefilled mail draft;
 *               nothing is delivered until the visitor hits send. NOT confirmed. */
export type SubmitStatus = 'idle' | 'submitting' | 'sent' | 'mailto' | 'error'

export interface ProjectTypeOption {
  value: ProjectType
  label: string
}

export const PROJECT_TYPES: ProjectTypeOption[] = [
  { value: 'new-build', label: 'New build — runtime / framework / tool' },
  { value: 'consulting', label: 'Consulting / architecture review' },
  { value: 'collaboration', label: 'Collaboration / contract' },
  { value: 'other', label: 'Something else' },
]

export const INITIAL_VALUES: HireMeValues = {
  name: '',
  email: '',
  projectType: 'new-build',
  budget: '',
  message: '',
}

/** Pure validation — no side effects, trivially testable. Returns the error map
 *  (empty when the form is valid). */
export function validateHireMe(values: HireMeValues): HireMeErrors {
  const errors: HireMeErrors = {}
  if (!values.name.trim()) {
    errors.name = 'Please enter your name.'
  }
  if (!values.email.trim()) {
    errors.email = 'Please enter your email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (values.message.trim().length < 10) {
    errors.message = 'Tell me a bit about the project (10+ characters).'
  }
  return errors
}

export function hasErrors(errors: HireMeErrors): boolean {
  return Object.keys(errors).length > 0
}
