import type { Meta, StoryObj } from '@storybook/react-vite'
import Contact from './Contact'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Root of the Contact section — delegates to ContactContainer (scroll-reveal +
 * link handlers). Needs drei ScrollControls (the container reads scroll range);
 * the store's contactY is seeded to 0 so the section frames at the origin.
 */
const meta = {
  title: 'Scene/Contact/Contact',
  component: Contact,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { scroll: 4, camera: [0, 0, 7] },
    scene: { contactY: 0 },
    a11y: { test: 'off' },
  },
} satisfies Meta<typeof Contact>

export default meta
type Story = StoryObj<typeof Contact>

export const Default: Story = {
  render: () => (
    <>
      <ambientLight intensity={0.8} />
      <Contact />
    </>
  ),
  play: sceneSmokeTest,
}
