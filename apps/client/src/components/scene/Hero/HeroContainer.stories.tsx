import type { Meta, StoryObj } from '@storybook/react-vite'
import HeroContainer from './HeroContainer'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Hero logic: rises and recedes as the camera scrolls past it (frame-damped
 * scroll-range reveal). Wrapped in ScrollControls so the container's scroll read
 * resolves.
 */
const meta = {
  title: 'Scene/Hero/HeroContainer',
  component: HeroContainer,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { scroll: 4, camera: [0, -0.5, 6] },
    a11y: { test: 'off' },
  },
} satisfies Meta<typeof HeroContainer>

export default meta
type Story = StoryObj<typeof HeroContainer>

export const Default: Story = {
  render: () => (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1} />
      <HeroContainer />
    </>
  ),
  play: sceneSmokeTest,
}
