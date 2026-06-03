import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within, userEvent } from 'storybook/test'
import PortalOverlay from './PortalOverlay'
import { usePortalOverlay } from '../../stores/usePortalOverlay'

/**
 * The DOM overlay that shows a registered site live within the portfolio. Seeded
 * open here against a provider that isn't running in the story, so it renders the
 * modal chrome (title + close) over its loading/error state — which is exactly
 * what the play tests assert (dialog a11y + close behavior).
 */
const meta = {
  title: 'Scene/PortalOverlay',
  component: PortalOverlay,
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta<typeof PortalOverlay>

export default meta
type Story = StoryObj<typeof PortalOverlay>

/** Opened on wasmos — shows the modal; close button dismisses it. */
export const Open: Story = {
  render: () => {
    // Unreachable origin → negotiate fails fast → deterministic error state,
    // independent of whether a provider happens to be running locally.
    usePortalOverlay.setState({ openApp: 'wasmos', providerOrigin: 'http://127.0.0.1:1' })
    return <PortalOverlay />
  },
  play: async () => {
    // The overlay portals to <body>, so query the document, not canvasElement.
    const body = within(document.body)
    const dialog = await body.findByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-label', 'WASM_OS')

    const close = body.getByRole('button', { name: /close/i })
    await userEvent.click(close)
    await expect(usePortalOverlay.getState().openApp).toBeNull()
  },
}

/** Closed — renders nothing. */
export const Closed: Story = {
  render: () => {
    usePortalOverlay.setState({ openApp: null, providerOrigin: null })
    return <PortalOverlay />
  },
  play: async () => {
    await expect(document.body.querySelector('.portal-overlay')).toBeNull()
  },
}
