import type { Meta, StoryObj } from '@storybook/react-vite'
import MeshProcessing from './MeshProcessing'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Root of the mesh-processing showcase — delegates to MeshProcessingContainer,
 * which loads the real logo GLB (served from public/assets/objects via
 * staticDirs) and scrubs it through the pipeline on scroll. Needs ScrollControls.
 */
const meta = {
  title: 'Scene/MeshProcessing/MeshProcessing',
  component: MeshProcessing,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { scroll: 5, camera: [0, 0, 5.5] },
    a11y: { test: 'off' },
  },
} satisfies Meta<typeof MeshProcessing>

export default meta
type Story = StoryObj<typeof MeshProcessing>

export const Default: Story = {
  render: () => (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 5]} intensity={1.1} />
      <MeshProcessing />
    </>
  ),
  play: sceneSmokeTest,
}
