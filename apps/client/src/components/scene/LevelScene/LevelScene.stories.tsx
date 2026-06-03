import type { Meta, StoryObj } from '@storybook/react-vite'
import LevelScene from './LevelScene'
import { setScroll } from '../../../stores/levelScroll'
import { useLevels } from '../../../stores/useLevels'
import { withCanvas, withLevels, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * In-Canvas composition root for the level system: background + fog, the brand
 * lights, the persistent layered-glass backdrop, the per-level camera
 * (LevelCamera), the single mounted level (LevelStage), and post-processing.
 * The most integration-level level story — mounts the whole in-Canvas stack for a
 * given active level.
 */
type SceneArgs = { level: number; progress: number }

const meta = {
  title: 'Levels/LevelScene',
  component: LevelScene,
  decorators: [withStore, withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    // LevelCamera owns the camera; the decorator Canvas camera is just a seed.
    canvas: { camera: [0, 0, 10] },
    a11y: { test: 'off' },
  },
  args: { level: 0, progress: 0 },
  argTypes: {
    level: {
      control: 'inline-radio',
      options: [0, 1, 2],
      description: '0 hero · 1 otherWork · 2 hireMe',
    },
    progress: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'In-level scroll progress for the active level.',
    },
  },
  render: (args: SceneArgs) => {
    useLevels.setState({ index: args.level })
    setScroll(args.progress)
    return <LevelScene />
  },
} satisfies Meta<SceneArgs>

export default meta
type Story = StoryObj<SceneArgs>

/** Hero level active (index 0) — the full in-Canvas stack. */
export const HeroActive: Story = { args: { level: 0, progress: 0 }, play: sceneSmokeTest }

/** Other Work level active (index 1) — portals in the full scene. */
export const OtherWorkActive: Story = { args: { level: 1, progress: 0.3 }, play: sceneSmokeTest }
