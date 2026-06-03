import type { Meta, StoryObj } from '@storybook/react-vite'
import OtherWorkLevel from './OtherWorkLevel'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Other Work level: hosts the portal launch elements (PortalShowcase), which open
 * each registered app in the PortalOverlay. PortalShowcase is inert unless
 * VITE_PORTAL_ORIGIN / VITE_PORTAL_APP are configured, so this is a smoke-mount
 * (renders without throwing).
 */
const meta = {
  title: 'Levels/OtherWorkLevel',
  component: OtherWorkLevel,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 12] },
    a11y: { test: 'off' },
  },
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 5]} intensity={1} />
      <OtherWorkLevel />
    </>
  ),
} satisfies Meta<typeof OtherWorkLevel>

export default meta
type Story = StoryObj<typeof OtherWorkLevel>

export const Default: Story = { play: sceneSmokeTest }
