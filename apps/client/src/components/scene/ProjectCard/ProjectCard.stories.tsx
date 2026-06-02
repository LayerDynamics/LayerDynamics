import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ProjectCard from './ProjectCard'
import type { ProjectCardContainerProps } from './ProjectCardContainer'
import { projects } from '../../../data/projects'
import { withCanvas, withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

const sample = projects[0]

/**
 * One project as a dimensional glass tile — delegates to ProjectCardContainer
 * (springs to target, lifts on hover, dims when another is focused). Store seeded
 * per-story to drive the hover/dim state.
 */
const meta = {
  title: 'Scene/ProjectCard/ProjectCard',
  component: ProjectCard,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 4] },
    a11y: { test: 'off' },
  },
  args: { project: sample, target: { position: [0, 0, 0], rotationY: 0 }, onOpen: fn() },
  argTypes: {
    project: {
      control: 'select',
      options: projects.map((p) => p.id),
      mapping: Object.fromEntries(projects.map((p) => [p.id, p])),
      description: 'Which showcase project the card renders.',
    },
    target: { control: false },
    onOpen: { control: false },
  },
  render: (args: ProjectCardContainerProps) => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1.2} />
      <ProjectCard {...args} />
    </>
  ),
} satisfies Meta<typeof ProjectCard>

export default meta
type Story = StoryObj<ProjectCardContainerProps>

export const Resting: Story = { parameters: { scene: { hovered: null } }, play: sceneSmokeTest }
export const Hovered: Story = {
  parameters: { scene: { hovered: sample.id } },
  play: sceneSmokeTest,
}
