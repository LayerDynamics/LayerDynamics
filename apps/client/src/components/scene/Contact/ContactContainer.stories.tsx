import type { Meta, StoryObj } from '@storybook/react-vite'
import ContactContainer from './ContactContainer'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Contact logic: parks at the store's dynamic contactY, frame-damps a
 * scroll-range reveal, and owns the link-open / cursor handlers. Wrapped in
 * ScrollControls (reads scroll) with contactY seeded to 0.
 */
const meta = {
  title: 'Scene/Contact/ContactContainer',
  component: ContactContainer,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { scroll: 4, camera: [0, 0, 7] },
    scene: { contactY: 0 },
    a11y: { test: 'off' },
  },
} satisfies Meta<typeof ContactContainer>

export default meta
type Story = StoryObj<typeof ContactContainer>

export const Default: Story = {
  render: () => (
    <>
      <ambientLight intensity={0.8} />
      <ContactContainer />
    </>
  ),
  play: sceneSmokeTest,
}
