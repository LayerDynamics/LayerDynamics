import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import type { Project } from '../data/projects'
import { tierColor, brand } from '../styles/brand'
import { useScene } from '../stores/useScene'
import { GRID } from './layout'

const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'
const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

export interface CardTarget {
  position: [number, number, number]
  rotationY: number
}

interface Props {
  project: Project
  target: CardTarget
  onOpen: (id: string) => void
}

/**
 * One project as a dimensional glass tile: a dark rounded slab with a glowing
 * tier-colored accent bar across the top — the same lit-edge language as the
 * hero monolith, so the cards belong to the same world. Damps toward its target
 * (which changes with the tier/domain lens), lifts and brightens on hover, and
 * dims when another card is focused. Click routes to the detail page.
 */
export default function ProjectCard({ project, target, onOpen }: Props) {
  const group = useRef<Group>(null)
  const face = useRef<MeshStandardMaterial>(null)
  const bar = useRef<Mesh>(null)
  const hoveredId = useScene((s) => s.hovered)
  const setHoveredId = useScene((s) => s.setHovered)
  const reducedMotion = useScene((s) => s.reducedMotion)

  const isHovered = hoveredId === project.id
  const dimmed = hoveredId !== null && !isHovered
  const color = tierColor[project.tier]
  const w = GRID.cardWidth
  const h = GRID.cardHeight

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    const [tx, ty, tz] = target.position
    const lift = isHovered ? 0.55 : 0
    const targetScale = isHovered ? 1.06 : dimmed ? 0.97 : 1

    if (reducedMotion) {
      g.position.set(tx, ty, tz + lift)
      g.rotation.y = target.rotationY
      g.scale.setScalar(targetScale)
    } else {
      g.position.x = MathUtils.damp(g.position.x, tx, 6, delta)
      g.position.y = MathUtils.damp(g.position.y, ty, 6, delta)
      g.position.z = MathUtils.damp(g.position.z, tz + lift, 6, delta)
      g.rotation.y = MathUtils.damp(g.rotation.y, target.rotationY, 6, delta)
      g.scale.setScalar(MathUtils.damp(g.scale.x, targetScale, 6, delta))
    }

    if (face.current) {
      const op = isHovered ? 0.72 : dimmed ? 0.32 : 0.5
      face.current.opacity = MathUtils.damp(face.current.opacity, op, 8, delta)
    }
    const barMat = bar.current?.material as MeshStandardMaterial | undefined
    if (barMat) {
      const e = isHovered ? 4.5 : dimmed ? 1.2 : 2.6
      barMat.emissiveIntensity = MathUtils.damp(barMat.emissiveIntensity, e, 8, delta)
    }
  })

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredId(project.id)
    document.body.style.cursor = 'pointer'
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHoveredId(null)
    document.body.style.cursor = 'auto'
  }
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onOpen(project.id)
  }

  return (
    <group
      ref={group}
      position={target.position}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      {/* Glass slab body. */}
      <RoundedBox args={[w, h, 0.14]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial
          ref={face}
          color={brand.bg2}
          emissive={color}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.3}
          transparent
          opacity={0.5}
        />
      </RoundedBox>

      {/* Glowing tier accent bar across the top — the bloom source. */}
      <mesh ref={bar} position={[0, h / 2 - 0.06, 0.075]}>
        <boxGeometry args={[w - 0.18, 0.05, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.6} toneMapped={false} />
      </mesh>

      <Text
        font={FONT_MED}
        position={[0, h / 2 - 0.34, 0.09]}
        fontSize={0.085}
        color={brand.cyan}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
        maxWidth={w - 0.3}
        textAlign="center"
      >
        {project.langs.join(' · ').toUpperCase()}
      </Text>

      <Text
        font={FONT_BOLD}
        position={[0, 0.16, 0.09]}
        fontSize={0.26}
        color={brand.lavender}
        anchorX="center"
        anchorY="middle"
        maxWidth={w - 0.36}
        textAlign="center"
      >
        {project.name}
      </Text>

      <Text
        font={FONT_MED}
        position={[0, -h / 2 + 0.34, 0.09]}
        fontSize={0.115}
        color="#bdb6cf"
        anchorX="center"
        anchorY="middle"
        maxWidth={w - 0.42}
        textAlign="center"
      >
        {project.tagline}
      </Text>
    </group>
  )
}
