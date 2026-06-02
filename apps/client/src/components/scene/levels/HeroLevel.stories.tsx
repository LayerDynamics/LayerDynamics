import type { Meta, StoryObj } from '@storybook/react-vite'
import HeroLevel from './HeroLevel'
import { setScroll } from '../../../stores/levelScroll'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Hero level: the layered-glass monolith + name, framed at the origin. In-level
 * progress (read from the levelScroll singleton) rises/recedes the hero. Advance
 * mode — progress is a reveal cue, not a scrub.
 */
/** `progress` is the level's in-level scroll (0→1) — the hero rises/recedes. */
type HeroLevelArgs = { progress: number }

const meta = {
  title: 'Levels/HeroLevel',
  component: HeroLevel,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, -0.4, 10] },
    a11y: { test: 'off' },
  },
  args: { progress: 0 },
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'In-level scroll progress (rises/recedes the hero).',
    },
  },
  render: (args: HeroLevelArgs) => {
    setScroll(args.progress)
    return (
      <>
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 6]} intensity={60} distance={30} />
        <pointLight position={[-4, -2, 5]} intensity={40} distance={30} color="#47bfff" />
        <HeroLevel />
      </>
    )
  },
} satisfies Meta<HeroLevelArgs>

export default meta
type Story = StoryObj<HeroLevelArgs>

/** Entry (progress 0). */
export const Default: Story = { args: { progress: 0 }, play: sceneSmokeTest }
/** Departing (progress 1) — hero risen/receded. */
export const Departing: Story = { args: { progress: 1 }, play: sceneSmokeTest }
