import type { RefObject } from 'react'
import { Text } from '@react-three/drei'
import type {
  BufferGeometry,
  Color,
  Group,
  Mesh,
  Points,
  ShaderMaterial,
} from 'three'
import { brand } from '../../../styles/brand'
import { SCENE } from '../lib/layout'
import { STAGES } from './constants'

const FONT_BOLD = '/fonts/SpaceGrotesk-Bold.woff'
const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

export interface MeshProcessingLayoutProps {
  /** Held group the container parks/releases in front of the camera. */
  holdRef: RefObject<Group | null>
  /** Inner group the container tilts (face-on parallax). */
  spinRef: RefObject<Group | null>
  pointsRef: RefObject<Points | null>
  solidRef: RefObject<Mesh | null>
  wireRef: RefObject<Mesh | null>
  /** Point-cloud geometry + shader material (built by the container). */
  pointGeo: BufferGeometry
  material: ShaderMaterial
  /** Source logo geometry, shared by the solid + wireframe meshes. */
  source: BufferGeometry
  /** Mono tint for the solid input mesh. */
  violet: Color
  /** Active pipeline-stage index → caption. */
  stage: number
}

/**
 * Presentational mesh-processing scene graph: the point system, the solid +
 * wireframe meshes, and the heading/stage captions. All animation values + the
 * geometry/material come from the container; this file only declares structure.
 */
export default function MeshProcessingLayout({
  holdRef,
  spinRef,
  pointsRef,
  solidRef,
  wireRef,
  pointGeo,
  material,
  source,
  violet,
  stage,
}: MeshProcessingLayoutProps) {
  return (
    <group ref={holdRef} position={[0, SCENE.collectionY, 0]}>
      <group ref={spinRef} position={[0, 0, 1.5]} scale={0.82}>
        <points ref={pointsRef} geometry={pointGeo} material={material} frustumCulled={false} />

        {/* Solid input: the smooth shaded source mesh that dissolves into the
            wireframe surface mesh, then the point cloud. */}
        <mesh ref={solidRef} geometry={source} frustumCulled={false}>
          <meshStandardMaterial
            color={violet}
            emissive={violet}
            emissiveIntensity={0.15}
            roughness={0.5}
            metalness={0.3}
            transparent
            opacity={1}
          />
        </mesh>

        {/* Surface mesh: wireframe reveal between solid and points. */}
        <mesh ref={wireRef} geometry={source} frustumCulled={false}>
          <meshBasicMaterial color={brand.cyan} wireframe transparent opacity={0} />
        </mesh>
      </group>

      {/* Section heading + active-stage caption. Children of the held group, so
          they stay framed with the geometry as it tracks the camera. */}
      <Text
        font={FONT_MED}
        position={[0, 2.55, 0]}
        fontSize={0.16}
        color={brand.cyan}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.36}
      >
        MESH PROCESSING
      </Text>

      <Text
        font={FONT_MED}
        position={[0, -2.35, 0]}
        fontSize={0.13}
        color="#6f6884"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.3}
      >
        {STAGES[stage].kicker}
      </Text>

      <Text
        font={FONT_BOLD}
        position={[0, -2.75, 0]}
        fontSize={0.34}
        color={brand.lavender}
        anchorX="center"
        anchorY="middle"
        maxWidth={9}
        textAlign="center"
        letterSpacing={0.01}
      >
        {STAGES[stage].title}
      </Text>
    </group>
  )
}
