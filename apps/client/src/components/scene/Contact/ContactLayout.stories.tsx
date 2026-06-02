import { useRef } from 'react'
import type { Group } from 'three'
import type { Meta, StoryObj } from '@storybook/react-vite'
import ContactLayout, { type ContactLayoutProps } from './ContactLayout'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Presentational close of the landing: headline, intro, and clickable social
 * links (real data from src/data/social). The container drives the inner reveal
 * group + supplies the click/cursor handler factories — here they are no-op
 * stubs so the layout renders standalone.
 */
const meta = {
  title: 'Scene/Contact/ContactLayout',
  component: ContactLayout,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 7] },
    a11y: { test: 'off' },
  },
  argTypes: {
    contactY: { control: { type: 'range', min: -10, max: 0, step: 0.5 } },
    innerRef: { control: false },
    open: { control: false },
    cursor: { control: false },
  },
} satisfies Meta<typeof ContactLayout>

export default meta
type Story = StoryObj<ContactLayoutProps>

export const Default: Story = {
  args: { contactY: 0 },
  render: function Render(args) {
    const innerRef = useRef<Group | null>(null)
    const noop = () => () => {}
    return (
      <>
        <ambientLight intensity={0.8} />
        <ContactLayout
          contactY={args.contactY}
          innerRef={innerRef}
          open={noop}
          cursor={noop}
        />
      </>
    )
  },
  play: sceneSmokeTest,
}
