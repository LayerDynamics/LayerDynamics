import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import Nav from './Nav'
import { withRouter } from '../../.storybook/decorators'

/**
 * Top navigation header. Uses react-router `Link` + `useLocation`; the
 * "← All work" back-link only appears on a project detail route. Mounted under
 * a MemoryRouter via the `withRouter` decorator (parameters.router.initialEntries
 * controls the simulated location).
 */
const meta = {
  title: 'DOM/Nav',
  component: Nav,
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
} satisfies Meta<typeof Nav>

export default meta
type Story = StoryObj<typeof Nav>

/** Landing route ("/") — brand, "Hire me", and external GitHub link only. */
export const Landing: Story = {
  parameters: { router: { initialEntries: ['/'] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('link', { name: /layer dynamics — home/i })).toBeInTheDocument()
    expect(canvas.getByRole('link', { name: /hire me/i })).toBeInTheDocument()
    expect(canvas.getByRole('link', { name: /github/i })).toBeInTheDocument()
    // No back-link on the landing route.
    expect(canvas.queryByRole('link', { name: /all work/i })).not.toBeInTheDocument()
  },
}

/** Project detail route — adds the "← All work" back-link. */
export const OnProjectDetail: Story = {
  parameters: { router: { initialEntries: ['/projects/portal'] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const back = canvas.getByRole('link', { name: /all work/i })
    expect(back).toBeInTheDocument()
    expect(back).toHaveAttribute('href', '/')
  },
}
