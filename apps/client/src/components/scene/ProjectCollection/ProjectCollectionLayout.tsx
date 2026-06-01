import { Text } from '@react-three/drei'
import { ProjectCard, type CardTarget } from '../ProjectCard'
import { projects } from '../../../data/projects'
import { brand } from '../../../styles/brand'
import type { Placed } from './types'

const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

export interface ProjectCollectionLayoutProps {
  /** Per-group label positions. */
  placed: Placed[]
  /** Per-card target transform, keyed by project id. */
  targets: Map<string, CardTarget>
  onOpen: (id: string) => void
}

/**
 * Presentational collection: one group label per group, and one stable
 * ProjectCard per project positioned by its target transform. The container
 * computes `placed` + `targets`; this file only declares the scene graph.
 */
export default function ProjectCollectionLayout({
  placed,
  targets,
  onOpen,
}: ProjectCollectionLayoutProps) {
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
