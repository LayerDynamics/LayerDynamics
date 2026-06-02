import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import HireMeContainer from './HireMeContainer'
import './HireMe.css'

/**
 * The "smart" half of the feature: pulls the form lifecycle from useHireMeForm
 * and wires real values/handlers into the presentational Layout/Form. Rendered
 * standalone here (it owns its own state via the hook).
 */
const meta = {
  title: 'DOM/HireMe/HireMeContainer',
  component: HireMeContainer,
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta<typeof HireMeContainer>

export default meta
type Story = StoryObj<typeof HireMeContainer>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('heading', { name: /hire me/i })).toBeInTheDocument()
    // The container wires the real fields in.
    expect(canvas.getByLabelText(/name/i)).toBeInTheDocument()
    expect(canvas.getByLabelText(/email/i)).toBeInTheDocument()
  },
}
