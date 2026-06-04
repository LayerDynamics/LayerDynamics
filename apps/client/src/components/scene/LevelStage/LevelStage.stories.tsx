import type { Meta, StoryObj } from '@storybook/react-vite'
import LevelStage from './LevelStage'
import { setScroll } from '../../../stores/levelScroll'
import { useLevels } from '../../../stores/useLevels'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * In-Canvas mount point for exactly ONE level at a time, keyed by the active
 * `useLevels` index (the key forces a true teardown on level change). `level` is
 * an interactive control — pick which level mounts.
 */
type StageArgs = { level: number }

const meta = {
  title: 'Levels/LevelStage',
  component: LevelStage,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 10] },
    a11y: { test: 'off' },
  },
  args: { level: 0 },
  argTypes: {
    level: {
      control: 'inline-radio',
      options: [0, 1, 2, 3],
      description: '0 hero · 1 languages · 2 otherWork · 3 hireMe',
    },
  },
  render: (args: StageArgs) => {
    useLevels.setState({ index: args.level })
    setScroll(0)
    return (
      <>
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 4, 6]} intensity={50} distance={30} />
        <directionalLight position={[2, 3, 5]} intensity={1} />
        <LevelStage />
      </>
    )
  },
} satisfies Meta<StageArgs>

export default meta
type Story = StoryObj<StageArgs>

/** Mounts the hero level (index 0). */
export const HeroMounted: Story = { args: { level: 0 }, play: sceneSmokeTest }
/** Mounts the languages level (index 1). */
export const LanguagesMounted: Story = { args: { level: 1 }, play: sceneSmokeTest }
/** Mounts the other-work level (index 2). */
export const OtherWorkMounted: Story = { args: { level: 2 }, play: sceneSmokeTest }
