import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ProjectCollectionContainer from './ProjectCollectionContainer'
import type { Lens } from '../../../stores/useScene'
import { useScene } from '../../../stores/useScene'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Collection logic: groups projects by the active `lens`, lays each group out as
 * a centered wrapping grid on a forward arc, and publishes the depth to the
 * store. `lens` is an interactive control (drives the store → re-groups).
 */
type CollectionArgs = { onOpen: (id: string) => void; lens: Lens }

const meta = {
  title: 'Scene/ProjectCollection/ProjectCollectionContainer',
  component: ProjectCollectionContainer,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    // Lift the collection (in-app at GRID.startY = -32) to the origin so the
    // standalone story frames it.
    canvas: { camera: [0, -3, 16] },
    a11y: { test: 'off' },
  },
  args: { onOpen: fn(), lens: 'tier' },
  argTypes: {
    onOpen: { control: false },
    lens: {
      control: 'inline-radio',
      options: ['tier', 'domain'] satisfies Lens[],
      description: 'Organizing lens — re-groups the collection.',
    },
  },
  render: (args: CollectionArgs) => {
    useScene.setState({ lens: args.lens })
    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 5]} intensity={1} />
        <group position={[0, 32, 0]}>
          <ProjectCollectionContainer onOpen={args.onOpen} />
        </group>
      </>
    )
  },
} satisfies Meta<CollectionArgs>

export default meta
type Story = StoryObj<CollectionArgs>

export const ByTier: Story = { args: { lens: 'tier' }, play: sceneSmokeTest }
export const ByDomain: Story = { args: { lens: 'domain' }, play: sceneSmokeTest }
