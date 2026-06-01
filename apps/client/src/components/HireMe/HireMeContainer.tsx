import HireMeLayout from './HireMeLayout'
import HireMeForm from './HireMeForm'
import { owner } from '../../data/social'
import { useHireMeForm } from '../../hooks/useHireMeForm'

/**
 * The "smart" half of the feature: pulls the form lifecycle from useHireMeForm
 * (state, validation, delivery) and wires the plain values + callbacks into the
 * presentational HireMeLayout / HireMeForm. Holds no logic itself.
 */
export default function HireMeContainer() {
  const { values, errors, status, errorMessage, onChange, onSubmit, onReset } = useHireMeForm()

  return (
    <HireMeLayout
      eyebrow={owner.brand.toUpperCase()}
      title="Hire me"
      intro={owner.intro}
      status={status}
      errorMessage={errorMessage}
      onReset={onReset}
    >
      <HireMeForm
        values={values}
        errors={errors}
        busy={status === 'submitting'}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </HireMeLayout>
  )
}
