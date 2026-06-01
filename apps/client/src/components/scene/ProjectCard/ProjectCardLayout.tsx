import type { ThreeEvent } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import { animated, type SpringValue } from '@react-spring/three'
import type { Project } from '../../../data/projects'
import { tierColor, brand } from '../../../styles/brand'
import { GRID } from '../lib/layout'

const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'
const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

export interface CardSpring {
  position: SpringValue<[number, number, number]>
  rotationY: SpringValue<number>
  scale: SpringValue<number>
  faceOpacity: SpringValue<number>
  barEmissive: SpringValue<number>
}

export interface ProjectCardLayoutProps {
  project: Project
  spring: CardSpring
  onOver: (e: ThreeEvent<PointerEvent>) => void
  onOut: (e: ThreeEvent<PointerEvent>) => void
  onClick: (e: ThreeEvent<MouseEvent>) => void
}

/**
 * Presentational project tile: a dark rounded glass slab with a glowing
 * tier-colored accent bar — the same lit-edge language as the hero monolith. All
 * transforms/opacities come in as react-spring values driven by the container.
 */
export default function ProjectCardLayout({
  project,
  spring,
  onOver,
  onOut,
  onClick,
}: ProjectCardLayoutProps) {
  const color = tierColor[project.tier]
  const w = GRID.cardWidth
  const h = GRID.cardHeight

  return (
    <animated.group
      position={spring.position}
      rotation-y={spring.rotationY}
      scale={spring.scale}
      onClick={onClick}
      onPointerOver={onOver}
      onPointerOut={onOut}
    >
      {/* Glass slab body. */}
      <RoundedBox args={[w, h, 0.14]} radius={0.08} smoothness={4}>
        <animated.meshPhysicalMaterial
          color={brand.bg2}
          emissive={color}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.3}
          transparent
          opacity={spring.faceOpacity}
        />
      </RoundedBox>

      {/* Glowing tier accent bar across the top — the bloom source. */}
      <mesh position={[0, h / 2 - 0.06, 0.075]}>
        <boxGeometry args={[w - 0.18, 0.05, 0.02]} />
        <animated.meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={spring.barEmissive}
          toneMapped={false}
        />
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
    </animated.group>
  )
}
