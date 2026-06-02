import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import HireMe from './HireMe'

/**
 * The HireMe feature's public entry point — composes the Container (state +
 * validation + delivery) with the presentational Layout/Form. This story renders
 * the whole feature exactly as the app mounts it.
 */
const meta = {
  title: 'DOM/HireMe/HireMe (feature)',
  component: HireMe,
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta<typeof HireMe>

export default meta
type Story = StoryObj<typeof HireMe>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('heading', { name: /hire me/i })).toBeInTheDocument()
    expect(canvas.getByRole('button', { name: /send inquiry/i })).toBeInTheDocument()
  },
}
