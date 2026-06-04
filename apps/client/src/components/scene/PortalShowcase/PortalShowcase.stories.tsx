import type { Meta, StoryObj } from '@storybook/react-vite'
import { PortalShowcase } from './PortalShowcase'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * PortalShowcase windows a registered live app into the Other Work level (consumer
 * #1 of @layerdynamics/portal). With no provider reachable it stays dormant and
 * shows the portal's animated placeholder — which is exactly what these smoke
 * stories assert (renders without throwing).
 */
const meta = {
  title: 'Scene/PortalShowcase',
  component: PortalShowcase,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, 0, 5] },
    a11y: { test: 'off' },
  },
  args: {
    app: 'demo-static',
    providerOrigin: 'http://localhost:5179',
    position: [0, 0, 0],
    size: [3, 2],
  },
} satisfies Meta<typeof PortalShowcase>

export default meta
type Story = StoryObj<typeof PortalShowcase>

/** A configured showcase (renders the dormant portal). */
export const Configured: Story = { play: sceneSmokeTest }

/** The wasmos portal — carries a description blurb rendered on the dormant card. */
export const Wasmos: Story = {
  args: { app: 'wasmos', size: [4, 2.6] },
  play: sceneSmokeTest,
}

/** The Forge portal — static GitHub Pages site embedded direct at its own origin. */
export const Forge: Story = {
  args: { app: 'forge', size: [4, 2.6] },
  play: sceneSmokeTest,
}

/** Unconfigured (no app/origin) → renders nothing, still mounts cleanly. */
export const Inert: Story = {
  args: { app: undefined, providerOrigin: undefined },
  play: sceneSmokeTest,
}
