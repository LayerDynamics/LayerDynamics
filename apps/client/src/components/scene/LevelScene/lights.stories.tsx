import type { Meta, StoryObj } from '@storybook/react-vite'
import { CameraRigless, type CameraRiglessProps } from './lights'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Scene lighting extracted from the old SceneContent: low ambient + a front-top
 * key and brand rim lights so glass slabs catch crisp specular highlights that
 * bloom. Every intensity, the key angle/penumbra, and the key color are controls
 * — shown lighting a reference glass slab.
 */
const meta = {
  title: 'Levels/LevelScene/lights (CameraRigless)',
  component: CameraRigless,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 6] },
    a11y: { test: 'off' },
  },
  args: {
    ambientIntensity: 0.35,
    keyIntensity: 120,
    keyColor: '#ffffff',
    keyAngle: 0.5,
    keyPenumbra: 0.8,
    rimCyanIntensity: 45,
    rimVioletSoftIntensity: 42,
    rimVioletIntensity: 30,
  },
  argTypes: {
    ambientIntensity: { control: { type: 'range', min: 0, max: 2, step: 0.01 } },
    keyIntensity: { control: { type: 'range', min: 0, max: 300, step: 1 } },
    keyColor: { control: 'color' },
    keyAngle: { control: { type: 'range', min: 0, max: 1.57, step: 0.01 } },
    keyPenumbra: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    rimCyanIntensity: { control: { type: 'range', min: 0, max: 200, step: 1 } },
    rimVioletSoftIntensity: { control: { type: 'range', min: 0, max: 200, step: 1 } },
    rimVioletIntensity: { control: { type: 'range', min: 0, max: 200, step: 1 } },
  },
  render: (args: CameraRiglessProps) => (
    <>
      <CameraRigless {...args} />
      {/* A reference slab so the lighting has a surface to read on. */}
      <mesh rotation={[0.3, 0.5, 0]}>
        <boxGeometry args={[2.4, 1.4, 0.2]} />
        <meshPhysicalMaterial color="#171526" metalness={0.4} roughness={0.25} clearcoat={1} />
      </mesh>
    </>
  ),
} satisfies Meta<typeof CameraRigless>

export default meta
type Story = StoryObj<typeof CameraRigless>

export const Default: Story = { play: sceneSmokeTest }
