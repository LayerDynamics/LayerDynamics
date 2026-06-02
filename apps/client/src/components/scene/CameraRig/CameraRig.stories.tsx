import type { Meta, StoryObj } from '@storybook/react-vite'
import CameraRig from './CameraRig'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Drives the scroll camera (all behavior lives in useCameraRig; the component
 * renders nothing). Needs drei ScrollControls (it reads scroll) and the store.
 * A reference grid + box is added so there is geometry for the rig to frame.
 */
const meta = {
  title: 'Scene/CameraRig',
  component: CameraRig,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { scroll: 4 },
    a11y: { test: 'off' },
  },
} satisfies Meta<typeof CameraRig>

export default meta
type Story = StoryObj<typeof CameraRig>

export const Default: Story = {
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1} />
      <gridHelper args={[20, 20, '#863bff', '#2a2440']} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#47bfff" />
      </mesh>
      <CameraRig />
    </>
  ),
  play: sceneSmokeTest,
}
