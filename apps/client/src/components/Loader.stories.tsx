import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import Loader from './Loader'
import { withStore } from '../../.storybook/decorators'
import { useScene } from '../stores/useScene'

/**
 * Brand loading overlay. Reflects drei's global asset progress and clears once
 * the scene is `ready` (a fallback timer guarantees it always clears). `ready` is
 * an interactive control here (it drives the store); withStore resets it between
 * stories.
 */
type LoaderArgs = { ready: boolean }

const meta = {
  title: 'DOM/Loader',
  component: Loader,
  decorators: [withStore],
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
  args: { ready: false },
  argTypes: {
    ready: { control: 'boolean', description: 'Scene ready — clears the overlay.' },
  },
  render: (args: LoaderArgs) => {
    useScene.setState({ ready: args.ready })
    return <Loader />
  },
} satisfies Meta<LoaderArgs>

export default meta
type Story = StoryObj<LoaderArgs>

/** Loading — overlay visible (store not yet ready). */
export const Loading: Story = {
  args: { ready: false },
  play: async ({ canvasElement }) => {
    // The overlay mounts; its mark image is present.
    const img = canvasElement.querySelector('.loader__mark')
    expect(img).toBeTruthy()
  },
}

/** Ready — overlay hidden (aria-hidden, data-hidden) once the scene is ready. */
export const Ready: Story = {
  args: { ready: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // At ready, the percentage reads 100%.
    expect(canvas.getByText('100%')).toBeInTheDocument()
  },
}
