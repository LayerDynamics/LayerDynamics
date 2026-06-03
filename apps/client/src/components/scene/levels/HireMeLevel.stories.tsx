import type { Meta, StoryObj } from '@storybook/react-vite'
import HireMeLevel from './HireMeLevel'
import { withCanvas, withLevels } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Contact ("hireMe") level — terminal. It renders nothing in-canvas: the real
 * Hire-Me form is a DOM overlay on the landing (see `HireMeOverlay`), shown over
 * the persistent backdrop. This story just smoke-mounts the (empty) level.
 */
const meta = {
  title: 'Levels/HireMeLevel',
  component: HireMeLevel,
  decorators: [withLevels, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 9] },
    a11y: { test: 'off' },
  },
  render: () => (
    <>
      <ambientLight intensity={0.8} />
      <HireMeLevel />
    </>
  ),
} satisfies Meta<typeof HireMeLevel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { play: sceneSmokeTest }
