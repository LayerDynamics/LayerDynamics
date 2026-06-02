import { useSpring } from '@react-spring/three'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ProjectCardLayout, { type CardSpring } from './ProjectCardLayout'
import { projects } from '../../../data/projects'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

const sample = projects[0]

/**
 * Presentational project tile: a dark rounded glass slab with a glowing
 * tier-colored accent bar. All transforms/opacities arrive as react-spring
 * values from the container — this story builds a real spring (via useSpring)
 * pinned to a chosen visual state, so each story shows resting / hovered / dimmed
 * without the container's pointer logic.
 */
const meta = {
  title: 'Scene/ProjectCard/ProjectCardLayout',
  component: ProjectCardLayout,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 4] },
    a11y: { test: 'off' },
  },
  args: { project: sample },
  argTypes: {
    project: {
      control: 'select',
      options: projects.map((p) => p.id),
      mapping: Object.fromEntries(projects.map((p) => [p.id, p])),
      description: 'Which showcase project the tile renders.',
    },
    spring: { control: false },
    onOver: { control: false },
    onOut: { control: false },
    onClick: { control: false },
  },
} satisfies Meta<typeof ProjectCardLayout>

export default meta
type Story = StoryObj<typeof ProjectCardLayout>

function makeRender(state: { scale: number; faceOpacity: number; barEmissive: number; lift: number }) {
  return function Render(args: { project: typeof sample }) {
    const spring = useSpring({
      position: [0, 0, state.lift] as [number, number, number],
      rotationY: 0,
      scale: state.scale,
      faceOpacity: state.faceOpacity,
      barEmissive: state.barEmissive,
    }) as unknown as CardSpring
    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={1.2} />
        <ProjectCardLayout
          project={args.project ?? sample}
          spring={spring}
          onOver={fn()}
          onOut={fn()}
          onClick={fn()}
        />
      </>
    )
  }
}

/** Resting state. */
export const Resting: Story = {
  render: makeRender({ scale: 1, faceOpacity: 0.5, barEmissive: 2.6, lift: 0 }),
  play: sceneSmokeTest,
}
/** Hovered — lifted, brighter accent bar. */
export const Hovered: Story = {
  render: makeRender({ scale: 1.06, faceOpacity: 0.72, barEmissive: 4.5, lift: 0.55 }),
  play: sceneSmokeTest,
}
/** Dimmed — another card is focused. */
export const Dimmed: Story = {
  render: makeRender({ scale: 0.97, faceOpacity: 0.32, barEmissive: 1.2, lift: 0 }),
  play: sceneSmokeTest,
}
