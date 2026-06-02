import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import SceneContent from './SceneContent'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Composition root for everything inside the Canvas/ScrollControls: the scene
 * background + lights, the camera rig, the persistent depth field, and all the
 * world-space sections (Hero → MeshProcessing → Collection → Contact) plus the
 * post-processing pass. The most integration-level story — it mounts the entire
 * landing scene graph (including both GLTF loads) headlessly to prove the whole
 * assembly commits without throwing.
 */
const meta = {
  title: 'Scene/SceneContent',
  component: SceneContent,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { scroll: 6 },
    a11y: { test: 'off' },
  },
  args: { onOpen: fn() },
  argTypes: { onOpen: { control: false } },
} satisfies Meta<typeof SceneContent>

export default meta
type Story = StoryObj<typeof SceneContent>

export const FullScene: Story = {
  render: (args) => <SceneContent {...args} />,
  play: sceneSmokeTest,
}
