import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import LensToggle from './LensToggle'
import { withStore } from '../../.storybook/decorators'
import { useScene } from '../stores/useScene'

/**
 * DOM segmented control overlaid on the landing canvas: organize the project
 * collection by tier or by domain. Lives outside the Canvas and drives the
 * `useScene` store. Only visible/focusable while the camera is in the collection
 * section — the store is seeded per-story via `withStore`.
 */
const meta = {
  title: 'DOM/LensToggle',
  component: LensToggle,
  decorators: [withStore],
  parameters: { layout: 'centered', a11y: { test: 'error' } },
} satisfies Meta<typeof LensToggle>

export default meta
type Story = StoryObj<typeof LensToggle>

/** Hidden — camera is in a non-collection section (aria-hidden, buttons untabbable). */
export const Hidden: Story = {
  parameters: { scene: { section: 'hero', lens: 'tier' } },
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('.lens')
    expect(group).toHaveAttribute('aria-hidden', 'true')
  },
}

/** Visible, "By tier" active. */
export const ByTier: Story = {
  parameters: { scene: { section: 'collection', lens: 'tier' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole('button', { name: /by tier/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

/** Visible, "By domain" active — clicking flips the store's lens. */
export const ByDomain: Story = {
  parameters: { scene: { section: 'collection', lens: 'tier' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /by domain/i }))
    expect(canvas.getByRole('button', { name: /by domain/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(useScene.getState().lens).toBe('domain')
  },
}
