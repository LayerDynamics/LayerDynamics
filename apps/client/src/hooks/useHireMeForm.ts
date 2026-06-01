import { useState } from 'react'
import {
  INITIAL_VALUES,
  hasErrors,
  validateHireMe,
  type HireMeErrors,
  type HireMeField,
  type HireMeValues,
  type SubmitStatus,
} from '../components/HireMe/types'
import { deliverInquiry } from '../components/HireMe/submit'

export interface UseHireMeForm {
  values: HireMeValues
  errors: HireMeErrors
  status: SubmitStatus
  /** Failure message shown when delivery errors. */
  errorMessage?: string
  onChange: (field: HireMeField, value: string) => void
  onSubmit: () => void
  onReset: () => void
}

/**
 * Owns the entire HireMe form lifecycle — field state, validation, and the
 * submission flow (delivery to the configured channels via deliverInquiry).
 * HireMeContainer consumes this and wires the values/handlers into the
 * presentational HireMeLayout / HireMeForm. All HireMe logic lives here.
 */
export function useHireMeForm(): UseHireMeForm {
  const [values, setValues] = useState<HireMeValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<HireMeErrors>({})
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>()

  const onChange = (field: HireMeField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Clear a field's error as soon as the user edits it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const onSubmit = async () => {
    const found = validateHireMe(values)
    setErrors(found)
    if (hasErrors(found)) return

    setStatus('submitting')
    setErrorMessage(undefined)
    try {
      await deliverInquiry(values)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong — please try again.',
      )
    }
  }

  const onReset = () => {
    setValues(INITIAL_VALUES)
    setErrors({})
    setErrorMessage(undefined)
    setStatus('idle')
  }

  return { values, errors, status, errorMessage, onChange, onSubmit, onReset }
}
