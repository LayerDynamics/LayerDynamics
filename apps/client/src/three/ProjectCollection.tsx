import { useEffect, useMemo } from 'react'
import { Text } from '@react-three/drei'
import ProjectCard, { type CardTarget } from './ProjectCard'
import {
  projects,
  projectsByTier,
  tiers,
  tierTitle,
  type Project,
} from '../data/projects'
import { presentDomains, projectsByDomain, domainShort } from '../data/domains'
import { useScene } from '../stores/useScene'
import { GRID } from './layout'
import { brand } from '../styles/brand'

const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

interface GroupDef {
  key: string
  label: string
  projects: Project[]
}

interface Placed {
  labelY: number
  group: GroupDef
}

/**
 * The whole project collection. Renders ONE stable card per project (keyed by
 * id) and lays each group (tier or domain) out as a tidy, centered grid that
 * wraps to new rows instead of a wide overlapping arc — so the collection reads
 * as organized strata, not clutter. Switching the lens re-targets the same
 * cards, which damp into the new arrangement. Publishes the collection depth so
 * the camera and Contact track it.
 */
export default function ProjectCollection({ onOpen }: { onOpen: (id: string) => void }) {
  const lens = useScene((s) => s.lens)
  const setContactY = useScene((s) => s.setContactY)

  const groups = useMemo<GroupDef[]>(() => {
    if (lens === 'tier') {
      return tiers.map((t) => ({
        key: `tier:${t}`,
        label: tierTitle[t],
        projects: projectsByTier(t),
      }))
    }
    return presentDomains().map((d) => ({
      key: `domain:${d}`,
      label: domainShort[d],
      projects: projectsByDomain(d),
    }))
  }, [lens])

  // Lay groups top-to-bottom; within a group, lay cards in centered, wrapping
  // rows on a shallow forward arc. Returns per-card targets, per-group label
  // positions, and the final bottom Y.
  const { targets, placed, bottomY } = useMemo(() => {
    const targets = new Map<string, CardTarget>()
    const placed: Placed[] = []
    const dx = GRID.cardWidth + GRID.gapX
    const dy = GRID.cardHeight + GRID.gapY
    let cursor = GRID.startY

    groups.forEach((g) => {
      const labelY = cursor
      const n = g.projects.length
      const rows = Math.ceil(n / GRID.maxPerRow)
      const firstRowY = cursor - GRID.labelGap

      g.projects.forEach((p, i) => {
        const row = Math.floor(i / GRID.maxPerRow)
        const colsInRow = Math.min(GRID.maxPerRow, n - row * GRID.maxPerRow)
        const col = i % GRID.maxPerRow
        const offset = col - (colsInRow - 1) / 2
        const x = offset * dx
        const norm = colsInRow > 1 ? offset / ((colsInRow - 1) / 2) : 0
        const z = -(norm * norm) * GRID.arcDepth
        const y = firstRowY - row * dy
        targets.set(p.id, { position: [x, y, z], rotationY: -x * 0.04 })
      })

      placed.push({ labelY, group: g })
      cursor = firstRowY - (rows - 1) * dy - GRID.cardHeight / 2 - GRID.groupGap - GRID.labelGap
    })

    const bottomY = cursor + GRID.labelGap // last cursor already stepped past the final group
    return { targets, placed, bottomY }
  }, [groups])

  useEffect(() => {
    setContactY(bottomY - 3)
  }, [bottomY, setContactY])

  return (
    <group>
      {placed.map(({ labelY, group }) => (
        <Text
          key={group.key}
          font={FONT_MED}
          position={[0, labelY, 0]}
          fontSize={0.34}
          color={brand.cyan}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.14}
        >
          {group.label.toUpperCase()}
        </Text>
      ))}

      {projects.map((p) => {
        const target = targets.get(p.id)
        if (!target) return null
        return <ProjectCard key={p.id} project={p} target={target} onOpen={onOpen} />
      })}
    </group>
  )
}
