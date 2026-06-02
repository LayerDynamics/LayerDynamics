import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import Landing from './Landing'
import { useLevels } from '../stores/useLevels'
import { withRouter, withLevels, withStore } from '../../.storybook/decorators'
import { sceneSmokeTest } from '../../.storybook/sceneTest'

/**
 * The immersive levels landing — the app's index route. Owns its own transparent
 * `<Canvas>` rendering exactly one level at a time (LevelScene → LevelStage), with
 * DOM siblings LevelInput / LevelTransitions / LevelIndicator. Router hooks live
 * here, so the story runs under a MemoryRouter (withRouter). `level` is an
 * interactive control — switch the active level of the whole landing. This is the
 * top-level integration story for the levels experience.
 */
type LandingArgs = { level: number }

const meta = {
  title: 'Routes/Landing',
  component: Landing,
  decorators: [withStore, withLevels, withRouter],
  parameters: { layout: 'fullscreen', a11y: { test: 'off' } },
  args: { level: 0 },
  argTypes: {
    level: {
      control: 'inline-radio',
      options: [0, 1, 2, 3],
      description: '0 hero · 1 processing · 2 otherWork · 3 hireMe',
    },
  },
  render: (args: LandingArgs) => {
    useLevels.setState({ index: args.level })
    return <Landing />
  },
} satisfies Meta<LandingArgs>

export default meta
type Story = StoryObj<LandingArgs>

/** Hero level (index 0) — the entry state. */
export const HeroLevel: Story = {
  args: { level: 0 },
  play: async ({ canvasElement }) => {
    await sceneSmokeTest({ canvasElement })
    const canvas = within(canvasElement)
    // The DOM indicator agrees with the active level.
    expect(canvas.getByText(/layer dynamics/i)).toBeInTheDocument()
    expect(canvas.getByText('01 / 04')).toBeInTheDocument()
  },
}

/** Other Work level (index 2) — the project grid level inside the full landing. */
export const OtherWorkLevel: Story = {
  args: { level: 2 },
  play: async ({ canvasElement }) => {
    await sceneSmokeTest({ canvasElement })
    const canvas = within(canvasElement)
    expect(canvas.getByText('03 / 04')).toBeInTheDocument()
  },
}
