import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ProjectCardContainer, {
  type ProjectCardContainerProps,
} from './ProjectCardContainer'
import { projects } from '../../../data/projects'
import { withCanvas } from '../../../../.storybook/decorators'
import { withStore } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

const sample = projects[0]

/**
 * Project-card logic component: derives hover/dim visual state from the
 * `useScene` store and springs the card toward its target transform. Rendered in
 * a real Canvas (`withCanvas`) with the store seeded per-story (`withStore`) and
 * fed a real Project from src/data. The hovered/dimmed stories prove the
 * store-driven visual state renders headlessly.
 */
const meta = {
  title: 'Scene/ProjectCard/ProjectCardContainer',
  component: ProjectCardContainer,
  decorators: [withStore, withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 4] },
    a11y: { test: 'off' },
  },
  args: {
    project: sample,
    target: { position: [0, 0, 0], rotationY: 0 },
    onOpen: fn(),
  },
  argTypes: {
    // `project` is a real, tunable prop: pick any of the ~20 showcase projects.
    // options are ids; mapping swaps the selected id for the Project object.
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
      <ProjectCardContainer {...args} />
    </>
  ),
} satisfies Meta<typeof ProjectCardContainer>

export default meta
type Story = StoryObj<ProjectCardContainerProps>

/** Resting card — nothing hovered. */
export const Default: Story = {
  parameters: { scene: { hovered: null } },
  play: sceneSmokeTest,
}

/** This card is the hovered one — lifts/brightens. */
export const Hovered: Story = {
  parameters: { scene: { hovered: sample.id } },
  play: sceneSmokeTest,
}

/** Another card is hovered — this one dims. */
export const Dimmed: Story = {
  parameters: { scene: { hovered: '__other__' } },
  play: sceneSmokeTest,
}
