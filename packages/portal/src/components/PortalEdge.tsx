import { useMemo } from 'react'
import * as THREE from 'three'

/** The portal rim — a brand-coral (#ff6750) emissive frame around the aperture
 *  that makes the opening read as a cut into another space. */
export function PortalEdge({
  width,
  height,
  intensity = 1,
}: {
  width: number
  height: number
  intensity?: number
}) {
  const geom = useMemo(() => {
    const w = width / 2
    const h = height / 2
    const shape = new THREE.Shape()
    shape.moveTo(-w, -h)
    shape.lineTo(w, -h)
    shape.lineTo(w, h)
    shape.lineTo(-w, h)
    shape.lineTo(-w, -h)
    const iw = Math.max(w - 0.06, 0.01)
    const ih = Math.max(h - 0.06, 0.01)
    const hole = new THREE.Path()
    hole.moveTo(-iw, -ih)
    hole.lineTo(iw, -ih)
    hole.lineTo(iw, ih)
    hole.lineTo(-iw, ih)
    hole.lineTo(-iw, -ih)
    shape.holes.push(hole)
    return new THREE.ShapeGeometry(shape)
  }, [width, height])

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
