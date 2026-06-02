import type { Meta, StoryObj } from '@storybook/react-vite'
import ProjectAccent from './ProjectAccent'
import type { Tier } from '../../../data/projects'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Self-contained scene content for a project detail page's mini Canvas —
 * delegates to ProjectAccentContainer (slow rotate/drift). `tier` selects the
 * tint; the layout supplies its own lights.
 */
const meta = {
  title: 'Scene/ProjectAccent/ProjectAccent',
  component: ProjectAccent,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 6] },
    a11y: { test: 'off' },
  },
  args: { tier: 'flagship' },
  argTypes: {
    tier: { control: 'inline-radio', options: ['flagship', 'strong', 'notable'] satisfies Tier[] },
  },
} satisfies Meta<typeof ProjectAccent>

export default meta
type Story = StoryObj<typeof ProjectAccent>

export const Flagship: Story = { args: { tier: 'flagship' }, play: sceneSmokeTest }
export const Strong: Story = { args: { tier: 'strong' }, play: sceneSmokeTest }
export const Notable: Story = { args: { tier: 'notable' }, play: sceneSmokeTest }
