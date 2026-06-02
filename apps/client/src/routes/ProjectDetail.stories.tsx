import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import ProjectDetail from './ProjectDetail'
import { projects } from '../data/projects'
import { withRouter } from '../../.storybook/decorators'

const sample = projects[0]

/**
 * Routed project detail page (DOM-first with a small 3D accent canvas). Reads the
 * `:id` route param via useParams, looks the project up in src/data, and redirects
 * home on an unknown id. Mounted under a MemoryRouter at /projects/:id via the
 * withRouter decorator (parameters.router.path + initialEntries).
 */
const meta = {
  title: 'Routes/ProjectDetail',
  component: ProjectDetail,
  decorators: [withRouter],
  parameters: { layout: 'fullscreen', a11y: { test: 'off' } },
} satisfies Meta<typeof ProjectDetail>

export default meta
type Story = StoryObj<typeof ProjectDetail>

/** A known project (the first showcase project) resolves and renders. */
export const KnownProject: Story = {
  parameters: {
    router: { path: '/projects/:id', initialEntries: [`/projects/${sample.id}`] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('heading', { name: sample.name })).toBeInTheDocument()
    expect(canvas.getByText(sample.tagline)).toBeInTheDocument()
    expect(canvas.getByRole('link', { name: /view on github/i })).toBeInTheDocument()
    expect(canvas.getByRole('link', { name: /all work/i })).toBeInTheDocument()
  },
}

/** Unknown id redirects to home — the page renders nothing (Navigate). */
export const UnknownProjectRedirects: Story = {
  parameters: {
    router: { path: '/projects/:id', initialEntries: ['/projects/does-not-exist'] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Redirected away — no detail heading rendered.
    expect(canvas.queryByText(sample.tagline)).not.toBeInTheDocument()
  },
}
