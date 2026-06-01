import type { ThreeEvent } from '@react-three/fiber'
import { useSpring } from '@react-spring/three'
import type { Project } from '../../../data/projects'
import { useScene } from '../../../stores/useScene'
import ProjectCardLayout from './ProjectCardLayout'
import type { CardTarget } from './types'

export interface ProjectCardContainerProps {
  project: Project
  target: CardTarget
  onOpen: (id: string) => void
}

/**
 * Project-card logic: derives the card's visual state from the hovered store +
 * its target transform, and drives every animated value with a single
 * react-spring spring (replacing the old per-frame MathUtils.damp loop). Cards
 * spring toward their target when the lens changes, lift/brighten on hover, and
 * dim when another card is focused.
 */
export default function ProjectCardContainer({ project, target, onOpen }: ProjectCardContainerProps) {
  const hoveredId = useScene((s) => s.hovered)
  const setHoveredId = useScene((s) => s.setHovered)
  const reducedMotion = useScene((s) => s.reducedMotion)

  const isHovered = hoveredId === project.id
  const dimmed = hoveredId !== null && !isHovered
  const [tx, ty, tz] = target.position
  const lift = isHovered ? 0.55 : 0

  const spring = useSpring({
    position: [tx, ty, tz + lift] as [number, number, number],
    rotationY: target.rotationY,
    scale: isHovered ? 1.06 : dimmed ? 0.97 : 1,
    faceOpacity: isHovered ? 0.72 : dimmed ? 0.32 : 0.5,
    barEmissive: isHovered ? 4.5 : dimmed ? 1.2 : 2.6,
    immediate: reducedMotion,
    config: { tension: 260, friction: 30 },
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredId(project.id)
    document.body.style.cursor = 'pointer'
  }
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredId(null)
    document.body.style.cursor = 'auto'
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onOpen(project.id)
  }

  return (
    <ProjectCardLayout
      project={project}
      spring={spring}
      onOver={onOver}
      onOut={onOut}
      onClick={onClick}
    />
  )
}
