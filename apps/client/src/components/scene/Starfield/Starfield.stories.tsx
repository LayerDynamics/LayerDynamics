import type { Meta, StoryObj } from '@storybook/react-vite'
import Starfield, { type StarfieldProps } from './Starfield'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * A deep, drifting field of brand-tinted points giving the scene atmosphere and
 * parallax depth. Deterministic (mulberry32 PRNG — render stays pure for the
 * React Compiler). Every visual/motion knob is a control.
 */
const meta = {
  title: 'Scene/Primitives/Starfield',
  component: Starfield,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 6] },
    a11y: { test: 'off' },
  },
  args: {
    count: 520,
    size: 0.07,
    opacity: 0.9,
    spreadX: 38,
    spreadY: 44,
    spreadZ: 26,
    driftSpeed: 0.01,
    parallaxX: 0.8,
    parallaxY: 0.5,
    hotFraction: 0.12,
    hotIntensity: 1.8,
    dimIntensity: 0.55,
    seed: 0x1a7e5,
  },
  argTypes: {
    count: { control: { type: 'range', min: 0, max: 4000, step: 10 } },
    size: { control: { type: 'range', min: 0.01, max: 0.5, step: 0.005 } },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    spreadX: { control: { type: 'range', min: 1, max: 80, step: 1 } },
    spreadY: { control: { type: 'range', min: 1, max: 80, step: 1 } },
    spreadZ: { control: { type: 'range', min: 1, max: 80, step: 1 } },
    driftSpeed: { control: { type: 'range', min: 0, max: 0.2, step: 0.005 } },
    parallaxX: { control: { type: 'range', min: 0, max: 3, step: 0.05 } },
    parallaxY: { control: { type: 'range', min: 0, max: 3, step: 0.05 } },
    hotFraction: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    hotIntensity: { control: { type: 'range', min: 0, max: 5, step: 0.05 } },
    dimIntensity: { control: { type: 'range', min: 0, max: 2, step: 0.05 } },
    seed: { control: { type: 'number' } },
  },
  render: (args: StarfieldProps) => <Starfield {...args} />,
} satisfies Meta<typeof Starfield>

export default meta
type Story = StoryObj<typeof Starfield>

/** Default field. */
export const Default: Story = { play: sceneSmokeTest }
/** Denser, smaller, faster-drifting variant. */
export const Dense: Story = {
  args: { count: 1500, size: 0.05, driftSpeed: 0.04 },
  play: sceneSmokeTest,
}
