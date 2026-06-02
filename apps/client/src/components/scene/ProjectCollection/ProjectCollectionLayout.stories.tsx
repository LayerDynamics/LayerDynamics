import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import ProjectCollectionLayout, {
  type ProjectCollectionLayoutProps,
} from './ProjectCollectionLayout'
import type { Placed } from './types'
import type { CardTarget } from '../ProjectCard'
import { projects, tiers, tierTitle, projectsByTier } from '../../../data/projects'
import { presentDomains, projectsByDomain, domainShort } from '../../../data/domains'
import type { Lens } from '../../../stores/useScene'
import { GRID } from '../lib/layout'
import { withCanvas } from '../../../../.storybook/decorators'
import { sceneSmokeTest } from '../../../../.storybook/sceneTest'

/**
 * Presentational collection: one label per group and one ProjectCard per project,
 * positioned by a per-card target transform. The container computes `placed` +
 * `targets` from the active lens; this story builds the same structures for the
 * chosen `lens` (interactive control) so the layout renders a faithful
 * arrangement standalone, framed at the origin.
 */
function buildLayout(lens: Lens): { placed: Placed[]; targets: Map<string, CardTarget> } {
  const targets = new Map<string, CardTarget>()
  const placed: Placed[] = []
  const dx = GRID.cardWidth + GRID.gapX
  let cursor = 0 // origin (the app offsets to GRID.startY = -32 below the hero)

  const groups =
    lens === 'tier'
      ? tiers.map((t) => ({ key: `tier:${t}`, label: tierTitle[t], projects: projectsByTier(t) }))
      : presentDomains().map((d) => ({
          key: `domain:${d}`,
          label: domainShort[d],
          projects: projectsByDomain(d),
        }))

  groups.forEach((group) => {
    const n = group.projects.length
    const firstRowY = cursor - GRID.labelGap
    group.projects.forEach((p, i) => {
      const offset = i - (n - 1) / 2
      targets.set(p.id, { position: [offset * dx, firstRowY, 0], rotationY: -offset * 0.04 })
    })
    placed.push({ labelY: cursor, group })
    cursor = firstRowY - GRID.cardHeight - GRID.groupGap
  })
  return { placed, targets }
}

type CollectionLayoutArgs = ProjectCollectionLayoutProps & { lens: Lens }

const meta = {
  title: 'Scene/ProjectCollection/ProjectCollectionLayout',
  component: ProjectCollectionLayout,
  decorators: [withCanvas],
  parameters: {
    layout: 'fullscreen',
    canvas: { camera: [0, -3, 14] },
    a11y: { test: 'off' },
  },
  args: { lens: 'tier' },
  argTypes: {
    lens: {
      control: 'inline-radio',
      options: ['tier', 'domain'] satisfies Lens[],
      description: 'Grouping the fixture builds the layout for.',
    },
    placed: { control: false },
    targets: { control: false },
    onOpen: { control: false },
  },
  render: (args: CollectionLayoutArgs) => {
    const { placed, targets } = buildLayout(args.lens)
    return (
      <>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 5]} intensity={1} />
        <ProjectCollectionLayout placed={placed} targets={targets} onOpen={fn()} />
      </>
    )
  },
} satisfies Meta<CollectionLayoutArgs>

export default meta
type Story = StoryObj<CollectionLayoutArgs>

export const ByTier: Story = {
  args: { lens: 'tier' },
  play: async ({ canvasElement }) => {
    await sceneSmokeTest({ canvasElement })
    // Sanity: the tier fixture places every project.
    if (buildLayout('tier').targets.size !== projects.length) {
      throw new Error('fixture did not place all projects')
    }
  },
}

export const ByDomain: Story = { args: { lens: 'domain' }, play: sceneSmokeTest }
