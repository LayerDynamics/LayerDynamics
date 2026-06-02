import type { Meta, StoryObj } from '@storybook/react-vite'
import ProjectAccentContainer from './ProjectAccentContainer'
import type { Tier } from '../../../data/projects'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * ProjectAccent logic: slow rotate + drift of the tier-tinted glass group.
 * `tier` selects the tint; the layout supplies its own lights.
 */
const meta = {
  title: 'Scene/ProjectAccent/ProjectAccentContainer',
  component: ProjectAccentContainer,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 6] },
    a11y: { test: 'off' },
  },
  args: { tier: 'flagship', rotateSpeed: 0.05, driftAmplitude: 0.2, driftSpeed: 0.3 },
  argTypes: {
    tier: { control: 'inline-radio', options: ['flagship', 'strong', 'notable'] satisfies Tier[] },
    rotateSpeed: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    driftAmplitude: { control: { type: 'range', min: 0, max: 2, step: 0.05 } },
    driftSpeed: { control: { type: 'range', min: 0, max: 2, step: 0.02 } },
  },
} satisfies Meta<typeof ProjectAccentContainer>

export default meta
type Story = StoryObj<typeof ProjectAccentContainer>

export const Flagship: Story = { args: { tier: 'flagship' }, play: sceneSmokeTest }
export const Notable: Story = { args: { tier: 'notable' }, play: sceneSmokeTest }
