import { Edges } from '@react-three/drei'
import { DoubleSide } from 'three'

export interface GlassLayerProps {
  width?: number
  height?: number
  /** Fill + emissive tint. */
  color?: string
  opacity?: number
  /** Rim/edge color and opacity for the glass border. */
  edge?: string
  edgeOpacity?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

/**
 * The reusable translucent "glass" panel that the whole layered-depth aesthetic
 * is built from. A thin, emissive, transparent plane with a lit rim edge. Cheap
 * enough to stack many of (depthWrite off so panes blend without z-fighting).
 *
 * A pure presentational primitive — no logic, so no Container (per the project's
 * pragmatic split): the file is the Layout.
 */
export default function GlassLayer({
  width = 4,
  height = 2.4,
  color = '#ff6750',
  opacity = 0.1,
  edge = '#ffffff',
  edgeOpacity = 0.35,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: GlassLayerProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.18}
        transparent
        opacity={opacity}
        roughness={0.35}
        metalness={0.1}
        depthWrite={false}
        side={DoubleSide}
      />
      <Edges>
        <lineBasicMaterial color={edge} transparent opacity={edgeOpacity} depthWrite={false} />
      </Edges>
    </mesh>
  )
}
