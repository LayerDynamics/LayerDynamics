import type { Meta, StoryObj } from '@storybook/react-vite'
import LayeredBackdrop from './LayeredBackdrop'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Root of the persistent depth field — delegates to LayeredBackdropContainer
 * (builds the glow texture, applies pointer parallax). No scroll needed.
 */
const meta = {
  title: 'Scene/LayeredBackdrop/LayeredBackdrop',
  component: LayeredBackdrop,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 2, 8] },
    a11y: { test: 'off' },
  },
} satisfies Meta<typeof LayeredBackdrop>

export default meta
type Story = StoryObj<typeof LayeredBackdrop>

export const Default: Story = {
  render: () => <LayeredBackdrop />,
  play: sceneSmokeTest,
}
