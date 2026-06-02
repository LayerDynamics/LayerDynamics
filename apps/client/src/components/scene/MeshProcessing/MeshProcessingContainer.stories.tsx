import type { Meta, StoryObj } from '@storybook/react-vite'
import MeshProcessingContainer from './MeshProcessingContainer'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Mesh-processing logic: loads + samples the real logo GLB, builds the point
 * geometry + dissolve shader, and derives the pipeline progress from scroll every
 * frame. Needs ScrollControls; the GLB is served via staticDirs.
 */
const meta = {
  title: 'Scene/MeshProcessing/MeshProcessingContainer',
  component: MeshProcessingContainer,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { scroll: 5, camera: [0, 0, 5.5] },
    a11y: { test: 'off' },
  },
} satisfies Meta<typeof MeshProcessingContainer>

export default meta
type Story = StoryObj<typeof MeshProcessingContainer>

export const Default: Story = {
  render: () => (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 5]} intensity={1.1} />
      <MeshProcessingContainer />
    </>
  ),
  play: sceneSmokeTest,
}
