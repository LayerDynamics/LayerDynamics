import { useRef } from 'react'
import type { Group } from 'three'
import type { Meta, StoryObj } from '@storybook/react-vite'
import HeroLayout from './HeroLayout'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Presentational hero scene-graph: the spinning brand mark over the name +
 * tagline (real data from src/data/social). The container animates the inner
 * group via the ref; here the ref is inert so the layout renders at rest.
 */
const meta = {
  title: 'Scene/Hero/HeroLayout',
  component: HeroLayout,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, -0.5, 6] },
    a11y: { test: 'off' },
  },
  argTypes: { innerRef: { control: false } },
} satisfies Meta<typeof HeroLayout>

export default meta
type Story = StoryObj<typeof HeroLayout>

export const Default: Story = {
  render: function Render() {
    const innerRef = useRef<Group | null>(null)
    return (
      <>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1} />
        <HeroLayout innerRef={innerRef} />
      </>
    )
  },
  play: sceneSmokeTest,
}
