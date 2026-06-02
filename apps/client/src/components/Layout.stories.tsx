import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import { withStore } from '../../.storybook/decorators'

/**
 * The app shell: Loader + Nav + the routed `<Outlet/>`. Mounted under a
 * MemoryRouter with Layout as the parent route and a placeholder index child so
 * the Outlet renders real content. Store seeded ready so the loader is cleared.
 */
const meta = {
  title: 'DOM/Layout',
  component: Layout,
  decorators: [
    withStore,
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Story />}>
            <Route
              index
              element={
                <main style={{ padding: '6rem 2rem', color: '#ffffff' }}>
                  <h1>Routed page content (Outlet)</h1>
                  <p>Nav above, loader overlay behind, this is the routed child.</p>
                </main>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: { layout: 'fullscreen', scene: { ready: true }, a11y: { test: 'error' } },
} satisfies Meta<typeof Layout>

export default meta
type Story = StoryObj<typeof Layout>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Nav brand + the routed Outlet content both present.
    expect(canvas.getByRole('link', { name: /layer dynamics — home/i })).toBeInTheDocument()
    expect(canvas.getByRole('heading', { name: /routed page content/i })).toBeInTheDocument()
  },
}
