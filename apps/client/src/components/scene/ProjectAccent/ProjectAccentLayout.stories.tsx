import { useRef } from 'react'
import type { Group } from 'three'
import type { Meta, StoryObj } from '@storybook/react-vite'
import ProjectAccentLayout, { type ProjectAccentLayoutProps } from './ProjectAccentLayout'
import { tierColor } from '../../../styles/brand'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Presentational mini-scene for a project detail page: tier-tinted layered glass
 * behind the spinning brand mark, lit by a key + tier rim light. Provides its own
 * lights; the container only drifts the group via the ref.
 */
const meta = {
  title: 'Scene/ProjectAccent/ProjectAccentLayout',
  component: ProjectAccentLayout,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 6] },
    a11y: { test: 'off' },
  },
  args: { color: tierColor.flagship },
  argTypes: {
    color: { control: 'color', description: 'Tier tint for the lights + glass.' },
    groupRef: { control: false },
  },
} satisfies Meta<typeof ProjectAccentLayout>

export default meta
type Story = StoryObj<ProjectAccentLayoutProps>

const render = function Render(args: ProjectAccentLayoutProps) {
  const groupRef = useRef<Group | null>(null)
  return <ProjectAccentLayout color={args.color} groupRef={groupRef} />
}

/** Flagship tier (violet). */
export const Flagship: Story = { args: { color: tierColor.flagship }, render, play: sceneSmokeTest }
/** Strong tier (indigo). */
export const Strong: Story = { args: { color: tierColor.strong }, render, play: sceneSmokeTest }
/** Notable tier (cyan). */
export const Notable: Story = { args: { color: tierColor.notable }, render, play: sceneSmokeTest }
