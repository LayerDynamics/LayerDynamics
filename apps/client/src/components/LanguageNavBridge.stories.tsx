import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import { useLocation } from 'react-router-dom'
import LanguageNavBridge from './LanguageNavBridge'
import { useLanguageNav } from '../stores/useLanguageNav'
import { withRouter } from '../../.storybook/decorators'

/** Probe that surfaces the current router path so the test can assert navigation. */
function PathProbe() {
  const { pathname } = useLocation()
  return <div data-testid="path">{pathname}</div>
}

/**
 * The DOM bridge that turns an in-Canvas language-logo click (a `pending` value in
 * useLanguageNav) into a route navigation. Renders nothing itself; the story pairs
 * it with a path probe and drives the store to assert the navigation fires once.
 */
const meta = {
  title: 'DOM/LanguageNavBridge',
  component: LanguageNavBridge,
  decorators: [withRouter],
  parameters: { layout: 'centered', a11y: { test: 'off' } },
  render: () => (
    <>
      <LanguageNavBridge />
      <PathProbe />
    </>
  ),
} satisfies Meta<typeof LanguageNavBridge>

export default meta
type Story = StoryObj<typeof LanguageNavBridge>

/** Setting `pending` navigates to /languages/:id and then clears the request. */
export const NavigatesOnPending: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByTestId('path')).toHaveTextContent('/')

    useLanguageNav.setState({ pending: null })
    useLanguageNav.getState().open('rust')

    await waitFor(() =>
      expect(canvas.getByTestId('path')).toHaveTextContent('/languages/rust'),
    )
    // The request is consumed (cleared) so it fires exactly once.
    expect(useLanguageNav.getState().pending).toBeNull()
  },
}
