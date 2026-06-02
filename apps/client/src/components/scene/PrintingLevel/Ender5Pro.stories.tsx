import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { GLTFLoader, DRACOLoader } from 'three-stdlib'
import { Model } from './Ender5Pro'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * The Ender 5 Pro printer mesh (gltfjsx-generated). Loads a **Draco-compressed**
 * GLB via drei's `useGLTF`. The `withCanvas` decorator points the Draco decoder
 * at the self-hosted `/draco/` path (Risk R2) and `staticDirs` serves the model
 * from `public/assets/objects/`.
 *
 * Because a missing decoder would leave `useGLTF` suspended forever (canvas
 * still mounts), the play() test additionally decodes the GLB end-to-end in the
 * same browser to *prove* the Draco pipeline resolves rather than hangs.
 */
const meta = {
  title: 'Scene/PrintingLevel/Ender5Pro',
  component: Model,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0.5, 1.4] },
    a11y: { test: 'off' },
  },
  args: {
    scale: 1,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  },
  argTypes: {
    scale: { control: { type: 'range', min: 0.2, max: 4, step: 0.1 }, description: 'Uniform model scale.' },
    position: { control: 'object', description: 'Group position [x, y, z].' },
    rotation: { control: 'object', description: 'Group rotation (radians) [x, y, z].' },
  },
  render: (args) => (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 4]} intensity={1.2} />
      <Model {...args} />
    </>
  ),
} satisfies Meta<typeof Model>

export default meta
type Story = StoryObj<typeof Model>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await sceneSmokeTest({ canvasElement })

    // End-to-end Draco proof: decode the same GLB through the self-hosted
    // decoder. Rejects (fails the test) if /draco/ or the model isn't served.
    const draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(draco)
    const gltf = await loader.loadAsync('/assets/objects/Ender5Pro.glb')
    expect(gltf.scene).toBeTruthy()
    expect(gltf.scene.children.length).toBeGreaterThan(0)
    draco.dispose()
  },
}
