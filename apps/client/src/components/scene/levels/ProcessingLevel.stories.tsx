import type { Meta, StoryObj } from '@storybook/react-vite'
import ProcessingLevel from './ProcessingLevel'
import { setScroll } from '../../../stores/levelScroll'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * 3D Processing level: the real logo GLB runs the Solid→Surface→Point-cloud→
 * Segmentation→Decimation→Variation pipeline, scrubbed by the level's own 0→1
 * progress (no global ScrollControls — the level is framed by LevelCamera).
 * Loads the logo GLB via staticDirs. `progress` scrubs the pipeline.
 */
type ProcessingLevelArgs = { progress: number }

const meta = {
  title: 'Levels/ProcessingLevel',
  component: ProcessingLevel,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 9] },
    a11y: { test: 'off' },
  },
  args: { progress: 0 },
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description:
        'Pipeline progress (scrubs Solid→Surface→Point-cloud→Segmentation→Decimation→Variation).',
    },
  },
  render: (args: ProcessingLevelArgs) => {
    setScroll(args.progress)
    return (
      <>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 5]} intensity={1.1} />
        <ProcessingLevel />
      </>
    )
  },
} satisfies Meta<ProcessingLevelArgs>

export default meta
type Story = StoryObj<ProcessingLevelArgs>

/** Solid input (progress 0). */
export const Solid: Story = { args: { progress: 0 }, play: sceneSmokeTest }
/** Mid-pipeline point cloud (progress 0.5). */
export const PointCloud: Story = { args: { progress: 0.5 }, play: sceneSmokeTest }
/** Final variation/generation (progress 0.9). */
export const Variation: Story = { args: { progress: 0.9 }, play: sceneSmokeTest }
