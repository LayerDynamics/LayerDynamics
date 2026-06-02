import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import HireMeLevel from './HireMeLevel'
import { setScroll } from '../../../stores/levelScroll'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Hire-me level (terminal): the close — headline, intro, social links (real
 * data), and a prominent "START A PROJECT →" CTA that routes to /hire via onHire.
 * Framed at the origin.
 */
type HireMeLevelArgs = { onHire: () => void; progress: number }

const meta = {
  title: 'Levels/HireMeLevel',
  component: HireMeLevel,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 9] },
    a11y: { test: 'off' },
  },
  args: { onHire: fn(), progress: 0.5 },
  argTypes: {
    onHire: { control: false },
    progress: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'In-level scroll progress (subtle settle-in of the close).',
    },
  },
  render: (args: HireMeLevelArgs) => {
    setScroll(args.progress)
    return (
      <>
        <ambientLight intensity={0.8} />
        <HireMeLevel onHire={args.onHire} />
      </>
    )
  },
} satisfies Meta<HireMeLevelArgs>

export default meta
type Story = StoryObj<HireMeLevelArgs>

export const Default: Story = { args: { progress: 0.5 }, play: sceneSmokeTest }
