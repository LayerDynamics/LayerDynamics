import type { Meta, StoryObj } from '@storybook/react-vite'
import OtherWorkLevel from './OtherWorkLevel'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Other Work level: hosts the portal launch elements (PortalShowcase), one per
 * registered app (WASM_OS + Forge), laid out responsively — side-by-side on
 * desktop, stacked in portrait. A provider origin is injected so the cards render
 * their dormant state; the smoke test asserts the scene actually draws.
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
  args: {
    // Unreachable origin — the cards render dormant (no live negotiate needed).
    providerOrigin: 'http://127.0.0.1:1',
  },
  render: (args) => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 5]} intensity={1} />
      <OtherWorkLevel {...args} />
    </>
  ),
} satisfies Meta<typeof OtherWorkLevel>

export default meta
type Story = StoryObj<typeof OtherWorkLevel>

export const Default: Story = { play: sceneSmokeTest }

/** Desktop aspect (wide) → the two portals lay out side-by-side. */
export const Landscape: Story = {
  parameters: { canvas: { camera: [0, 0, 12], width: 1280, height: 720 } },
  play: sceneSmokeTest,
}

/** Phone aspect (390×844 portrait) → the two portals stack vertically. */
export const Portrait: Story = {
  parameters: { canvas: { camera: [0, 0, 12], width: 390, height: 844 } },
  play: sceneSmokeTest,
}
