import type { Meta, StoryObj } from '@storybook/react-vite'
import LayeredBackdropContainer, {
  type LayeredBackdropContainerProps,
} from './LayeredBackdropContainer'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Backdrop logic: builds the radial-glow CanvasTexture and applies pointer
 * parallax to the whole backdrop group each frame. Parallax strengths, damping,
 * and glow appearance are controls.
 */
const meta = {
  title: 'Scene/LayeredBackdrop/LayeredBackdropContainer',
  component: LayeredBackdropContainer,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 2, 8] },
    a11y: { test: 'off' },
  },
  args: {
    parallaxX: 1.2,
    parallaxY: 0.7,
    rotateAmount: 0.04,
    dampRate: 3,
    glowColor: '#863bff',
    glowOpacity: 0.32,
    glowSize: 19,
  },
  argTypes: {
    parallaxX: { control: { type: 'range', min: 0, max: 5, step: 0.05 } },
    parallaxY: { control: { type: 'range', min: 0, max: 5, step: 0.05 } },
    rotateAmount: { control: { type: 'range', min: 0, max: 0.5, step: 0.005 } },
    dampRate: { control: { type: 'range', min: 0.5, max: 10, step: 0.1 } },
    glowColor: { control: 'color' },
    glowOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    glowSize: { control: { type: 'range', min: 4, max: 40, step: 1 } },
  },
  render: (args: LayeredBackdropContainerProps) => <LayeredBackdropContainer {...args} />,
} satisfies Meta<typeof LayeredBackdropContainer>

export default meta
type Story = StoryObj<typeof LayeredBackdropContainer>

export const Default: Story = { play: sceneSmokeTest }
