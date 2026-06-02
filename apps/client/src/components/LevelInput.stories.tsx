import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import LevelInput from './LevelInput'
import { scrollProgress, setScroll } from '../stores/levelScroll'
import { useLevels } from '../stores/useLevels'

/**
 * Captures advance/reverse intent from wheel/touch/keyboard and drives the
 * shared in-level `scrollProgress` (0..1), arming level transitions at the ends.
 * Renders nothing — pure DOM side-effects into the stores. The play() test
 * fires a keydown and asserts the cross-Canvas progress ref moved.
 */
const meta = {
  title: 'Levels/DOM/LevelInput',
  component: LevelInput,
  parameters: { layout: 'centered', a11y: { test: 'off' } },
} satisfies Meta<typeof LevelInput>

export default meta
type Story = StoryObj<typeof LevelInput>

export const Default: Story = {
  render: () => (
    <div style={{ color: '#bdb6cf', padding: 24 }}>
      LevelInput renders nothing — it binds wheel/touch/key listeners that drive
      the level scroll. Focus this frame and press <kbd>↓</kbd> to advance progress.
      <LevelInput />
    </div>
  ),
  play: async () => {
    // Reset shared state, then simulate a forward key step.
    useLevels.setState({ index: 0, phase: 'live', locked: false })
    setScroll(0)
    const before = scrollProgress.current
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(scrollProgress.current).toBeGreaterThan(before)
  },
}
