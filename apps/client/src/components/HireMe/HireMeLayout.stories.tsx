import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import HireMeLayout, { type HireMeLayoutProps } from './HireMeLayout'
import './HireMe.css'

/**
 * The presentational shell for the feature: section frame, header copy, and the
 * glass panel that cross-fades between the form body and the success state, plus
 * the error banner. Owns the feature's motion (react-spring) but no logic — every
 * state is driven purely by the `status` prop.
 */
const meta = {
  title: 'DOM/HireMe/HireMeLayout',
  component: HireMeLayout,
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
  args: {
    eyebrow: 'LAYER DYNAMICS',
    title: 'Hire me',
    intro:
      'I build runtimes, frameworks, and developer tools. Tell me what you are building.',
    status: 'idle',
    errorMessage: 'Delivery failed — please try again.',
    onReset: () => {},
    children: (
      <p style={{ color: '#bdb6cf' }}>
        (Form body slot — the real feature renders HireMeForm here.)
      </p>
    ),
  },
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['idle', 'submitting', 'sent', 'mailto', 'error'],
      description: 'Submission lifecycle — drives which panel body is shown.',
    },
    eyebrow: { control: 'text' },
    title: { control: 'text' },
    intro: { control: 'text' },
    errorMessage: { control: 'text' },
    onReset: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof HireMeLayout>

export default meta
type Story = StoryObj<HireMeLayoutProps>

/** Default: header + panel holding the body slot. */
export const Idle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('heading', { name: /hire me/i })).toBeInTheDocument()
  },
}

/** Confirmed send — a channel (Web3Forms/Discord) accepted the inquiry. */
export const Sent: Story = {
  args: { status: 'sent' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(await canvas.findByText(/message sent/i)).toBeInTheDocument()
    expect(canvas.getByText(/on its way/i)).toBeInTheDocument()
    expect(canvas.getByRole('button', { name: /send another/i })).toBeInTheDocument()
  },
}

/** Mailto fallback — no channel configured, so only a draft was opened. The copy
 *  must NOT claim a confirmed send: it asks the visitor to hit send themselves. */
export const Mailto: Story = {
  args: { status: 'mailto' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(await canvas.findByText(/finish in your mail client/i)).toBeInTheDocument()
    expect(canvas.getByText(/nothing reaches me until you do/i)).toBeInTheDocument()
    // Guard against regressing to the false-confirmation copy.
    expect(canvas.queryByText(/on its way/i)).not.toBeInTheDocument()
  },
}

/** Error banner shown above the form when delivery fails. */
export const ErrorState: Story = {
  args: { status: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(await canvas.findByRole('alert')).toHaveTextContent(/delivery failed/i)
  },
}
