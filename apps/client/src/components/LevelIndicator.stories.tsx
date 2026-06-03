import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import LevelIndicator from './LevelIndicator'
import { withLevels } from '../../.storybook/decorators'
import { useLevels } from '../stores/useLevels'

/**
 * Minimal level-progress indicator: the active level's name, an NN / 04 counter,
 * and a dotted rail. Reads the live `useLevels` index (single source of truth).
 * `level` is an interactive control here (drives the store index); withLevels
 * resets it between stories.
 */
type IndicatorArgs = { level: number }

const meta = {
  title: 'Levels/DOM/LevelIndicator',
  component: LevelIndicator,
  decorators: [withLevels],
  parameters: { layout: 'centered', a11y: { test: 'error' } },
  args: { level: 0 },
  argTypes: {
    level: {
      control: 'inline-radio',
      options: [0, 1, 2, 3],
      description: '0 hero · 1 processing · 2 otherWork · 3 hireMe',
    },
  },
  render: (args: IndicatorArgs) => {
    useLevels.setState({ index: args.level })
    return <LevelIndicator />
  },
} satisfies Meta<IndicatorArgs>

export default meta
type Story = StoryObj<IndicatorArgs>

/** First level (hero). */
export const Hero: Story = {
  args: { level: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/layer dynamics/i)).toBeInTheDocument()
    expect(canvas.getByText('01 / 04')).toBeInTheDocument()
  },
}

/** Middle level (3D Processing). */
export const Processing: Story = {
  args: { level: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/3d processing/i)).toBeInTheDocument()
    expect(canvas.getByText('02 / 04')).toBeInTheDocument()
  },
}

/** Terminal level (Hire Me): the indicator hides itself — that level is the
 *  full-screen Hire-Me form (HireMeOverlay), so the fixed counter would float
 *  over the form's fields. */
export const HireMe: Story = {
  args: { level: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.queryByText('04 / 04')).not.toBeInTheDocument()
    expect(canvasElement.querySelector('.level-indicator')).toBeNull()
  },
}
