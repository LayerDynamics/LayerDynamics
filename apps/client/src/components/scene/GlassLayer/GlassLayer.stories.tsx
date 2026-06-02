import type { Meta, StoryObj } from '@storybook/react-vite'
import GlassLayer, { type GlassLayerProps } from './GlassLayer'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * The reusable translucent "glass" panel primitive (a lit, emissive, transparent
 * plane with a rim edge). Rendered inside a real `<Canvas frameloop="always">`
 * via the `withCanvas` decorator; the story body supplies the lighting that the
 * meshStandardMaterial needs to show.
 */
const meta = {
  title: 'Scene/Primitives/GlassLayer',
  component: GlassLayer,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 5] },
    // R3F renders to <canvas>; axe can't introspect WebGL contents.
    a11y: { test: 'off' },
  },
  args: {
    width: 4,
    height: 2.4,
    color: '#ff6750',
    opacity: 0.1,
    edge: '#ffffff',
    edgeOpacity: 0.35,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  argTypes: {
    color: { control: 'color', description: 'Fill + emissive tint.' },
    edge: { control: 'color', description: 'Rim/edge color.' },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    edgeOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    width: { control: { type: 'range', min: 0.5, max: 8, step: 0.1 } },
    height: { control: { type: 'range', min: 0.5, max: 6, step: 0.1 } },
    // position/rotation are 3-tuples — set via story args, not a scalar control.
    position: { control: 'object' },
    rotation: { control: 'object' },
  },
  render: (args: GlassLayerProps) => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <GlassLayer {...args} />
    </>
  ),
} satisfies Meta<typeof GlassLayer>

export default meta
type Story = StoryObj<GlassLayerProps>

/** Default violet pane. */
export const Default: Story = { play: sceneSmokeTest }

/** Cyan-tinted, more opaque variant. */
export const Cyan: Story = {
  args: { color: '#ffffff', opacity: 0.22, edge: '#ffffff', edgeOpacity: 0.6 },
  play: sceneSmokeTest,
}

/** A tall, angled pane — exercises the rotation/aspect props. */
export const TallAngled: Story = {
  args: { width: 2.2, height: 4, rotation: [0, 0.5, 0.1] },
  play: sceneSmokeTest,
}
