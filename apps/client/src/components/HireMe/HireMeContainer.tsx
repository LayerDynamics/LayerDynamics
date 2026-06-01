import { useState } from 'react'
import HireMeLayout from './HireMeLayout'
import HireMeForm from './HireMeForm'
import {
  INITIAL_VALUES,
  hasErrors,
  validateHireMe,
  type HireMeErrors,
  type HireMeField,
  type HireMeValues,
  type SubmitStatus,
} from './types'
import { social, owner } from '../../data/social'

/** Where inquiries go. Single source of truth is the social data. */
const CONTACT_EMAIL =
  social.find((s) => s.id === 'email')?.value ?? 'layerdynamics@proton.me'

/** Optional real backend. If set, submissions POST here as JSON; otherwise the
 *  form composes a fully prefilled mail draft via the visitor's mail client.
 *  Both paths are complete — there is no stub. */
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined

function buildMailto(values: HireMeValues): string {
  const subject = `Project inquiry — ${values.name}`
  const body = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Project type: ${values.projectType}`,
    values.budget ? `Budget: ${values.budget}` : null,
    '',
    values.message,
  ]
    .filter((line) => line !== null)
    .join('\n')
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

async function sendInquiry(values: HireMeValues): Promise<void> {
  if (ENDPOINT) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    return
  }
  // No endpoint configured: open the visitor's mail client, fully prefilled.
  window.location.href = buildMailto(values)
}

/**
 * The "smart" half of the feature: owns form state, validation, and the
 * submission lifecycle, then hands plain data + callbacks to the presentational
 * HireMeLayout / HireMeForm. This is the only HireMe file that holds logic.
 */
export default function HireMeContainer() {
  const [values, setValues] = useState<HireMeValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<HireMeErrors>({})
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleChange = (field: HireMeField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Clear a field's error as soon as the user edits it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = async () => {
    const found = validateHireMe(values)
    setErrors(found)
    if (hasErrors(found)) return

    setStatus('submitting')
    setErrorMessage(undefined)
    try {
      await sendInquiry(values)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong — please try again.')
    }
  }

  const handleReset = () => {
    setValues(INITIAL_VALUES)
    setErrors({})
    setErrorMessage(undefined)
    setStatus('idle')
  }

  return (
    <HireMeLayout
      eyebrow={owner.brand.toUpperCase()}
      title="Hire me"
      intro={owner.intro}
      status={status}
      errorMessage={errorMessage}
      onReset={handleReset}
    >
      <HireMeForm
        values={values}
        errors={errors}
        busy={status === 'submitting'}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </HireMeLayout>
  )
}
