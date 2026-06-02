import type { Meta, StoryObj } from '@storybook/react-vite'
import Effects, { type EffectsProps } from './Effects'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Scene-wide post-processing: Bloom (the load-bearing effect that turns the
 * brand's emissive accents into a real glow) + Vignette. Every knob is a control
 * — drag the bloom/vignette sliders over the bright emissive source mesh.
 */
const meta = {
  title: 'Scene/Effects',
  component: Effects,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 5] },
    a11y: { test: 'off' },
  },
  args: {
    bloomIntensity: 1.15,
    bloomThreshold: 0.55,
    bloomSmoothing: 0.18,
    bloomRadius: 0.85,
    vignetteOffset: 0.3,
    vignetteDarkness: 0.55,
    multisampling: 4,
  },
  argTypes: {
    bloomIntensity: { control: { type: 'range', min: 0, max: 4, step: 0.05 } },
    bloomThreshold: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    bloomSmoothing: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    bloomRadius: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    vignetteOffset: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    vignetteDarkness: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    multisampling: { control: { type: 'range', min: 0, max: 8, step: 1 } },
  },
} satisfies Meta<typeof Effects>

export default meta
type Story = StoryObj<typeof Effects>

export const Default: Story = {
  render: (args: EffectsProps) => (
    <>
      <ambientLight intensity={0.3} />
      {/* A bright emissive source so Bloom has something above the luminance
          threshold to glow. toneMapped off keeps the emissive hot. */}
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial
          color="#ff6750"
          emissive="#ff9d8a"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      <Effects {...args} />
    </>
  ),
  play: sceneSmokeTest,
}
