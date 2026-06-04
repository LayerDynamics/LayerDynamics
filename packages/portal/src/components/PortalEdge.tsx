import { useMemo } from 'react'
import * as THREE from 'three'
import { traceRoundedRect } from './lib/roundedRect'

/** The portal rim — a brand-coral (#ff6750) emissive frame around the aperture
 *  that makes the opening read as a cut into another space. Pass `radius` to
 *  round the corners (defaults to square). */
export function PortalEdge({
  width,
  height,
  intensity = 1,
  radius = 0,
}: {
  width: number
  height: number
  intensity?: number
  radius?: number
}) {
  const geom = useMemo(() => {
    const w = width / 2
    const h = height / 2
    const thickness = 0.06
    const shape = new THREE.Shape()
    traceRoundedRect(shape, w, h, radius)
    const iw = Math.max(w - thickness, 0.01)
    const ih = Math.max(h - thickness, 0.01)
    const hole = new THREE.Path()
    traceRoundedRect(hole, iw, ih, radius - thickness)
    shape.holes.push(hole)
    return new THREE.ShapeGeometry(shape)
  }, [width, height, radius])

  return (
    <mesh geometry={geom} position={[0, 0, 0.001]}>
      <meshStandardMaterial
        color="#ff6750"
        emissive="#ff6750"
        emissiveIntensity={intensity}
        toneMapped={false}
      />
    </mesh>
  )
}
