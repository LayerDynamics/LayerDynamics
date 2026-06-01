import { useEffect, useMemo } from 'react'
import { projectsByTier, tiers, tierTitle } from '../../../data/projects'
import { presentDomains, projectsByDomain, domainShort } from '../../../data/domains'
import { useScene } from '../../../stores/useScene'
import { GRID } from '../lib/layout'
import type { CardTarget } from '../ProjectCard'
import ProjectCollectionLayout from './ProjectCollectionLayout'
import type { GroupDef, Placed } from './types'

export interface ProjectCollectionContainerProps {
  onOpen: (id: string) => void
}

/**
 * Collection logic: groups projects by the active lens (tier/domain), lays each
 * group out as a centered, wrapping grid on a shallow forward arc, and publishes
 * the collection depth to the store so the camera + Contact track it. Hands the
 * computed label positions + per-card targets to the presentational layout.
 */
export default function ProjectCollectionContainer({ onOpen }: ProjectCollectionContainerProps) {
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

    const bottomY = cursor + GRID.labelGap
    return { targets, placed, bottomY }
  }, [groups])

  useEffect(() => {
    setContactY(bottomY - 3)
  }, [bottomY, setContactY])

  return <ProjectCollectionLayout placed={placed} targets={targets} onOpen={onOpen} />
}
