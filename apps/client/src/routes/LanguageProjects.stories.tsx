import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, within } from 'storybook/test'
import LanguageProjects from './LanguageProjects'
import { reposForLanguage } from '../data/languages'
import { withRouter } from '../../.storybook/decorators'

const rustRepos = reposForLanguage('rust')

/**
 * Routed per-language page (DOM-first + a 3D logo accent). Reads :lang via
 * useParams, looks the language up in data/languages.ts, and redirects home on an
 * unknown slug. Mounted under a MemoryRouter at /languages/:lang via withRouter.
 */
const meta = {
  title: 'Routes/LanguageProjects',
  component: LanguageProjects,
  decorators: [withRouter],
  parameters: { layout: 'fullscreen', a11y: { test: 'off' } },
} satisfies Meta<typeof LanguageProjects>

export default meta
type Story = StoryObj<typeof LanguageProjects>

/** Rust page: header + the curated repo cards, each linking to GitHub. */
export const RustPage: Story = {
  parameters: {
    router: { path: '/languages/:lang', initialEntries: ['/languages/rust'] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('heading', { name: 'Rust' })).toBeInTheDocument()
    // Every curated repo renders a card linking to its GitHub repo.
    for (const repo of rustRepos) {
      const link = canvas.getByRole('link', { name: new RegExp(`${repo.name} on github`, 'i') })
      expect(link).toHaveAttribute('href', repo.url)
      expect(link).toHaveAttribute('target', '_blank')
    }
    expect(canvas.getByRole('link', { name: /back/i })).toBeInTheDocument()
  },
}

/** Portrait phone frame (~390 wide) — the grid collapses to a single column. */
export const RustPagePortrait: Story = {
  parameters: {
    router: { path: '/languages/:lang', initialEntries: ['/languages/rust'] },
  },
  decorators: [
    (Story: () => ReactNode) => (
      <div style={{ width: 390, height: 844, overflow: 'auto', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('heading', { name: 'Rust' })).toBeInTheDocument()
    expect(
      canvas.getByRole('link', { name: /mechx on github/i }),
    ).toBeInTheDocument()
  },
}

/** Unknown slug redirects home — nothing from the page renders. */
export const UnknownRedirects: Story = {
  parameters: {
    router: { path: '/languages/:lang', initialEntries: ['/languages/cobol'] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.queryByRole('heading', { name: 'Rust' })).not.toBeInTheDocument()
  },
}
