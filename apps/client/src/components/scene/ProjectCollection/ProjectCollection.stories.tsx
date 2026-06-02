import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ProjectCollection from './ProjectCollection'
import type { Lens } from '../../../stores/useScene'
import { useScene } from '../../../stores/useScene'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * The whole project collection — delegates to ProjectCollectionContainer, which
 * groups projects by the active `lens` (tier/domain) and lays them out. `lens` is
 * an interactive control here (it drives the store → re-arranges the grid);
 * withStore resets it between stories.
 */
type CollectionArgs = { onOpen: (id: string) => void; lens: Lens }

const meta = {
  title: 'Scene/ProjectCollection/ProjectCollection',
  component: ProjectCollection,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    // The collection sits at GRID.startY (-32) in-app; lift it to the origin for
    // a standalone story so the camera frames the top groups.
    canvas: { camera: [0, -3, 16] },
    a11y: { test: 'off' },
  },
  args: { onOpen: fn(), lens: 'tier' },
  argTypes: {
    onOpen: { control: false },
    lens: {
      control: 'inline-radio',
      options: ['tier', 'domain'] satisfies Lens[],
      description: 'Organizing lens — re-arranges the grid.',
    },
  },
  render: (args: CollectionArgs) => {
    useScene.setState({ lens: args.lens })
    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 5]} intensity={1} />
        <group position={[0, 32, 0]}>
          <ProjectCollection onOpen={args.onOpen} />
        </group>
      </>
    )
  },
} satisfies Meta<CollectionArgs>

export default meta
type Story = StoryObj<CollectionArgs>

export const ByTier: Story = { args: { lens: 'tier' }, play: sceneSmokeTest }
export const ByDomain: Story = { args: { lens: 'domain' }, play: sceneSmokeTest }
