import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import LevelTransitions from './LevelTransitions'
import { withLevels } from '../../.storybook/decorators'

/**
 * DOM-side transition driver + curtain: a full-viewport gradient that rises to
 * occlude the canvas at a transition's midpoint (when the level index swaps) then
 * falls, so two levels are never visible at once. At rest (`phase: 'live'`) the
 * curtain is transparent and non-interactive.
 */
const meta = {
  title: 'Levels/DOM/LevelTransitions',
  component: LevelTransitions,
  decorators: [withLevels],
  parameters: { layout: 'fullscreen', a11y: { test: 'off' } },
} satisfies Meta<typeof LevelTransitions>

export default meta
type Story = StoryObj<typeof LevelTransitions>

/** Idle — curtain mounted but transparent and click-through. */
export const Idle: Story = {
  parameters: { levels: { index: 0, phase: 'live' } },
  play: async ({ canvasElement }) => {
    const curtain = canvasElement.querySelector('.level-curtain') as HTMLElement
    expect(curtain).toBeTruthy()
    // At rest the curtain does not capture pointer events.
    expect(curtain.style.pointerEvents).toBe('none')
  },
}
