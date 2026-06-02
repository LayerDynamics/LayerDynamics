import type { Meta, StoryObj } from '@storybook/react-vite'
import Hero from './Hero'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Root of the Hero section — delegates to HeroContainer (scroll-driven rise/
 * recede). Needs drei ScrollControls because the container reads scroll range.
 */
const meta = {
  title: 'Scene/Hero/Hero',
  component: Hero,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { scroll: 4, camera: [0, -0.5, 6] },
    a11y: { test: 'off' },
  },
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof Hero>

export const Default: Story = {
  render: () => (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1} />
      <Hero />
    </>
  ),
  play: sceneSmokeTest,
}
