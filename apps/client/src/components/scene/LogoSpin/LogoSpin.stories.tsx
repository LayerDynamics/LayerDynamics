import type { Meta, StoryObj } from '@storybook/react-vite'
import LogoSpin, { type LogoSpinProps } from './LogoSpin'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * The hero focal object: a tower of stacked glass slabs twisting into a slow
 * helix, with emissive bars grading colorBottom → colorTop up the stack (the
 * bloom sources). Every shape/motion/material knob is a control.
 */
const meta = {
  title: 'Scene/Primitives/LogoSpin',
  component: LogoSpin,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 6] },
    a11y: { test: 'off' },
  },
  args: {
    scale: 1,
    slabCount: 9,
    span: 3.2,
    twist: 0.12,
    spinSpeed: 0.22,
    wobbleAmount: 0.06,
    wobbleSpeed: 0.3,
    baseWidth: 2.7,
    baseDepth: 1.6,
    slabThickness: 0.16,
    taperAmount: 0.34,
    glowIntensity: 3.4,
    bodyEmissive: 0.25,
    opacity: 0.92,
    colorBottom: '#e0452e',
    colorTop: '#ffffff',
  },
  argTypes: {
    scale: { control: { type: 'range', min: 0.3, max: 2, step: 0.05 } },
    slabCount: { control: { type: 'range', min: 1, max: 30, step: 1 } },
    span: { control: { type: 'range', min: 0.5, max: 8, step: 0.1 } },
    twist: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    spinSpeed: { control: { type: 'range', min: 0, max: 2, step: 0.02 } },
    wobbleAmount: { control: { type: 'range', min: 0, max: 0.5, step: 0.01 } },
    wobbleSpeed: { control: { type: 'range', min: 0, max: 2, step: 0.02 } },
    baseWidth: { control: { type: 'range', min: 0.5, max: 5, step: 0.05 } },
    baseDepth: { control: { type: 'range', min: 0.3, max: 4, step: 0.05 } },
    slabThickness: { control: { type: 'range', min: 0.05, max: 0.6, step: 0.01 } },
    taperAmount: { control: { type: 'range', min: 0, max: 0.9, step: 0.01 } },
    glowIntensity: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    bodyEmissive: { control: { type: 'range', min: 0, max: 2, step: 0.02 } },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    colorBottom: { control: 'color' },
    colorTop: { control: 'color' },
  },
  render: (args: LogoSpinProps) => (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 6]} intensity={60} distance={30} />
      <pointLight position={[-4, -2, 5]} intensity={40} distance={30} color="#ffffff" />
      <LogoSpin {...args} />
    </>
  ),
} satisfies Meta<typeof LogoSpin>

export default meta
type Story = StoryObj<typeof LogoSpin>

/** Default monolith. */
export const Default: Story = { play: sceneSmokeTest }
/** Small. */
export const Small: Story = { args: { scale: 0.5 }, play: sceneSmokeTest }
/** Taller tower with more slabs and a stronger twist. */
export const TallTwisted: Story = {
  args: { slabCount: 16, span: 5, twist: 0.28 },
  play: sceneSmokeTest,
}
