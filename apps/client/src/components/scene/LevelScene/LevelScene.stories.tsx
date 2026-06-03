import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import LevelScene from './LevelScene'
import type { LevelCallbacks } from '../levels'
import { setScroll } from '../../../stores/levelScroll'
import { useLevels } from '../../../stores/useLevels'
import { withCanvas, withLevels, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

const cb: LevelCallbacks = { onOpen: fn() }

/**
 * In-Canvas composition root for the level system: background + fog, the brand
 * lights, the persistent layered-glass backdrop, the per-level camera
 * (LevelCamera), the single mounted level (LevelStage), and post-processing.
 * Replaces the old continuous SceneContent. The most integration-level level
 * story — mounts the whole in-Canvas stack for a given active level.
 */
type SceneArgs = { cb: LevelCallbacks; level: number; progress: number }

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
  args: { cb, level: 0, progress: 0 },
  argTypes: {
    cb: { control: false },
    level: {
      control: 'inline-radio',
      options: [0, 1, 2, 3],
      description: '0 hero · 1 processing · 2 otherWork · 3 hireMe',
    },
    progress: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'In-level scroll progress for the active level.',
    },
  },
  render: (args: SceneArgs) => {
    useLevels.setState({ index: args.level })
    setScroll(args.progress)
    return <LevelScene cb={args.cb} />
  },
} satisfies Meta<SceneArgs>

export default meta
type Story = StoryObj<SceneArgs>

/** Hero level active (index 0) — the full in-Canvas stack. */
export const HeroActive: Story = { args: { level: 0, progress: 0 }, play: sceneSmokeTest }

/** Processing level active (index 1) — exercises a GLTF-loading level inside the full scene. */
export const ProcessingActive: Story = { args: { level: 1, progress: 0.3 }, play: sceneSmokeTest }
