import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import HireMeOverlay from './HireMeOverlay'
import { useLevels, LEVEL_COUNT } from '../../stores/useLevels'

/**
 * The Hire-Me form as it appears on the landing's final level (DOM overlay over
 * the canvas). The store is forced to the contact level so the overlay renders;
 * the play test asserts the real form + the carried-over social links are there.
 */
const meta = {
  title: 'DOM/HireMe/HireMeOverlay',
  component: HireMeOverlay,
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
  decorators: [
    (Story) => {
      useLevels.setState({ index: LEVEL_COUNT - 1, phase: 'live', locked: false })
      return <Story />
    },
  ],
} satisfies Meta<typeof HireMeOverlay>

export default meta
type Story = StoryObj<typeof HireMeOverlay>

export const OnContactLevel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('heading', { name: /hire me/i })).toBeInTheDocument()
    expect(canvas.getByRole('button', { name: /send inquiry/i })).toBeInTheDocument()
    expect(canvas.getByRole('link', { name: /github/i })).toBeInTheDocument()
    expect(canvas.getByRole('link', { name: /email/i })).toBeInTheDocument()
  },
}
