import type { Meta, StoryObj } from '@storybook/react-vite'
import Printer from '../Printer/Printer'
import { setScroll } from '../../../stores/levelScroll'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * The reusable Ender 5 Printer rig: bed + head driven by the active level's scroll
 * progress (read from the `levelScroll` module-singleton, not a prop). The hero
 * level mounts this with the printed name; here it renders bare. Loads the Draco
 * GLB via the self-hosted decoder. Each story pins the level-scroll value to park
 * the print at a chosen point in the stroke.
 */
type PrintingLevelArgs = { progress: number }

const meta = {
  title: 'Scene/Printer/Printer',
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 1.5, 8] },
    a11y: { test: 'off' },
  },
  args: { progress: 0 },
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'In-level scroll progress — scrubs the bed descent + head raster.',
    },
  },
  render: (args: PrintingLevelArgs) => {
    // Pin the cross-Canvas level-scroll singleton from the control.
    setScroll(args.progress)
    return (
      <>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 4]} intensity={1.2} />
        <Printer />
      </>
    )
  },
} satisfies Meta<PrintingLevelArgs>

export default meta
type Story = StoryObj<PrintingLevelArgs>

/** Start of the print (progress 0). */
export const Start: Story = { args: { progress: 0 }, play: sceneSmokeTest }
/** Mid-print (progress 0.5). */
export const MidPrint: Story = { args: { progress: 0.5 }, play: sceneSmokeTest }
/** Near completion (progress 0.95). */
export const NearDone: Story = { args: { progress: 0.95 }, play: sceneSmokeTest }
