import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import RepoCard from './RepoCard'
import { reposForLanguage } from '../data/languages'

const mechx = reposForLanguage('rust')[0]
const logly = reposForLanguage('python').find((r) => r.name === 'logly') ?? mechx

/**
 * One curated GitHub repo card. The whole card links to the repo on GitHub
 * (target=_blank). Uses real repo data from data/languages.ts.
 */
const meta = {
  title: 'DOM/RepoCard',
  component: RepoCard,
  parameters: { layout: 'centered', a11y: { test: 'error' } },
  args: { repo: mechx },
} satisfies Meta<typeof RepoCard>

export default meta
type Story = StoryObj<typeof RepoCard>

/** Repo with stars hidden (mechx has 0 stars). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: /mechx on github/i })
    expect(link).toHaveAttribute('href', 'https://github.com/LayerDynamics/mechx')
    expect(link).toHaveAttribute('target', '_blank')
    expect(canvas.getByText('mechx')).toBeInTheDocument()
    expect(canvas.getByText(/simulation engine/i)).toBeInTheDocument()
    // 0-star repo hides the star count.
    expect(canvas.queryByText(/★/)).not.toBeInTheDocument()
  },
}

/** Repo with a star count shown. */
export const WithStars: Story = {
  args: { repo: logly },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText('logly')).toBeInTheDocument()
    expect(canvas.getByText(/★/)).toBeInTheDocument()
  },
}
