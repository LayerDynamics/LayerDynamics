import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import ScrollHint from './ScrollHint'

/**
 * One-time "VVV" scroll cue shown on the landing before the visitor's first
 * scroll. It owns window listeners (wheel / touchmove / arrow|page|space keys)
 * and removes itself — adds the `--hidden` class — the instant any of them fire.
 */
const meta = {
  title: 'DOM/ScrollHint',
  component: ScrollHint,
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
} satisfies Meta<typeof ScrollHint>

export default meta
type Story = StoryObj<typeof ScrollHint>

/** Initial state — the cue is visible (label + three chevrons), not yet dismissed. */
export const Visible: Story = {
  play: async ({ canvasElement }) => {
    const hint = canvasElement.querySelector('.scroll-hint')
    expect(hint).toBeTruthy()
    expect(hint?.classList.contains('scroll-hint--hidden')).toBe(false)
    expect(canvasElement.querySelector('.scroll-hint__label')?.textContent).toBe('Scroll')
    expect(canvasElement.querySelectorAll('.scroll-hint__chevrons svg')).toHaveLength(3)
  },
}

/** The cue removes itself the instant a scroll begins (a wheel event here). */
export const DismissesOnScroll: Story = {
  play: async ({ canvasElement }) => {
    const hint = canvasElement.querySelector('.scroll-hint')
    expect(hint?.classList.contains('scroll-hint--hidden')).toBe(false)
    // The "second they start scrolling" — one wheel event dismisses it.
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 40 }))
    await waitFor(() =>
      expect(hint?.classList.contains('scroll-hint--hidden')).toBe(true),
    )
  },
}
