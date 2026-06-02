import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import OtherWorkLevel from './OtherWorkLevel'
import { setScroll } from '../../../stores/levelScroll'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Other Work level: the ~20 code projects as a centered, tier-grouped grid
 * (real data from src/data). Scrolling pans the grid vertically; clicking a card
 * opens its detail route via onOpen. Progress pinned per-story.
 */
type OtherWorkLevelArgs = { onOpen: (id: string) => void; progress: number }

const meta = {
  title: 'Levels/OtherWorkLevel',
  component: OtherWorkLevel,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 12] },
    a11y: { test: 'off' },
  },
  args: { onOpen: fn(), progress: 0 },
  argTypes: {
    onOpen: { control: false },
    progress: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Scroll progress — pans the project grid vertically.',
    },
  },
  render: (args: OtherWorkLevelArgs) => {
    setScroll(args.progress)
    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 5]} intensity={1} />
        <OtherWorkLevel onOpen={args.onOpen} />
      </>
    )
  },
} satisfies Meta<OtherWorkLevelArgs>

export default meta
type Story = StoryObj<OtherWorkLevelArgs>

/** Top of the grid (progress 0). */
export const Top: Story = { args: { progress: 0 }, play: sceneSmokeTest }
/** Panned to the bottom (progress 1). */
export const Bottom: Story = { args: { progress: 1 }, play: sceneSmokeTest }
