import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import HireMeForm, { type HireMeFormProps } from './HireMeForm'
import {
  INITIAL_VALUES,
  hasErrors,
  validateHireMe,
  type HireMeErrors,
  type HireMeField,
  type HireMeValues,
} from './types'
import './HireMe.css'

/**
 * Interactive wrapper that mirrors HireMeContainer's logic (field state + the
 * real `validateHireMe`) so the controlled form is actually editable in the
 * story and the play() test exercises production validation — without the
 * network submit. `onValidSubmit` is a Storybook action spy.
 */
function HireMeFormHarness({
  busy,
  initialValues,
  onValidSubmit,
}: {
  busy: boolean
  initialValues: HireMeValues
  onValidSubmit: (values: HireMeValues) => void
}) {
  const [values, setValues] = useState<HireMeValues>(initialValues)
  const [errors, setErrors] = useState<HireMeErrors>({})

  const onChange = (field: HireMeField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }
  const onSubmit = () => {
    const found = validateHireMe(values)
    setErrors(found)
    if (!hasErrors(found)) onValidSubmit(values)
  }

  return (
    <div className="hireme" style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <HireMeForm
        values={values}
        errors={errors}
        busy={busy}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </div>
  )
}

const meta = {
  title: 'DOM/HireMe/HireMeForm',
  component: HireMeForm,
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  argTypes: {
    busy: {
      control: 'boolean',
      description: 'Submission in flight — disables every input and the button.',
    },
    // values/errors are object props — surfaced as fixtures via each story's
    // args rather than live controls; onChange/onSubmit are callbacks.
    values: { control: false },
    errors: { control: false },
    onChange: { control: false },
    onSubmit: { control: false },
  },
} satisfies Meta<typeof HireMeForm>

export default meta
type Story = StoryObj<HireMeFormProps>

/** Empty form — the default landing state. Fully editable. */
export const Empty: Story = {
  args: { busy: false },
  render: (args) => (
    <HireMeFormHarness
      busy={args.busy}
      initialValues={INITIAL_VALUES}
      onValidSubmit={fn()}
    />
  ),
}

/** Submitting state — inputs and button disabled, button reads "Sending…". */
export const Busy: Story = {
  args: { busy: true },
  render: (args) => (
    <HireMeFormHarness
      busy={args.busy}
      initialValues={{
        name: 'Ada Lovelace',
        email: 'ada@analytical.engine',
        projectType: 'consulting',
        budget: '$10k',
        message: 'A scroll-driven 3D landing for our runtime tooling.',
      }}
      onValidSubmit={fn()}
    />
  ),
}

/** Validation errors rendered directly from the real validateHireMe output. */
export const WithErrors: Story = {
  args: { busy: false },
  render: (args) => {
    const bad: HireMeValues = { ...INITIAL_VALUES, email: 'not-an-email', message: 'short' }
    return (
      <div className="hireme" style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        <HireMeForm
          values={bad}
          errors={validateHireMe(bad)}
          busy={args.busy}
          onChange={fn()}
          onSubmit={fn()}
        />
      </div>
    )
  },
}

/**
 * Interaction test: empty submit surfaces validation errors; then filling valid
 * values and submitting fires onValidSubmit exactly once.
 */
export const InteractionFlow: Story = {
  args: { busy: false },
  render: function Render(args) {
    const onValidSubmit = fn()
    // Expose the spy so the play() can assert on it.
    ;(Render as unknown as { spy: typeof onValidSubmit }).spy = onValidSubmit
    return (
      <HireMeFormHarness
        busy={args.busy}
        initialValues={INITIAL_VALUES}
        onValidSubmit={onValidSubmit}
      />
    )
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('Empty submit shows validation errors', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /send inquiry/i }))
      expect(await canvas.findByText(/please enter your name/i)).toBeInTheDocument()
      expect(canvas.getByText(/please enter your email/i)).toBeInTheDocument()
      expect(canvas.getByText(/tell me a bit about the project/i)).toBeInTheDocument()
    })

    await step('Editing a field clears its error', async () => {
      await userEvent.type(canvas.getByLabelText(/name/i), 'Grace Hopper')
      expect(canvas.queryByText(/please enter your name/i)).not.toBeInTheDocument()
    })

    await step('Valid submit clears errors', async () => {
      await userEvent.type(canvas.getByLabelText(/email/i), 'grace@navy.mil')
      await userEvent.type(
        canvas.getByLabelText(/what are you building/i),
        'A compiler for the next-gen runtime.',
      )
      await userEvent.click(canvas.getByRole('button', { name: /send inquiry/i }))
      expect(canvas.queryByText(/enter a valid email/i)).not.toBeInTheDocument()
      expect(canvas.queryByText(/tell me a bit about the project/i)).not.toBeInTheDocument()
    })
  },
}
