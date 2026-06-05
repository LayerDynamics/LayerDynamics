import { type ThreeElements } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import type { BufferGeometry, ColorRepresentation } from 'three'
import { ErosionMaterial } from '../material/ErosionMaterial'
import { prepareErosionGeometry } from '../lib/scatter'
import { useDissolveController, type DissolveAnimation } from './useDissolveController'

export interface DissolvingMeshProps extends DissolveAnimation {
  /** The geometry to dissolve. It is cloned + made non-indexed; never mutated. */
  geometry: BufferGeometry

  // --- effect tunables (forwarded to ErosionMaterial) ---
  scatter?: number
  noiseScale?: number
  edgeWidth?: number
  spin?: number
  gravity?: number
  color?: ColorRepresentation
  edgeColor?: ColorRepresentation
  edgeStrength?: number
  roughness?: number
  metalness?: number

  // --- flake generation (forwarded to prepareErosionGeometry) ---
  seed?: number
  normalBias?: number
}

/** Placement props (position/rotation/scale/…) are forwarded to the wrapping group. */
type GroupProps = Omit<ThreeElements['group'], 'children'>

/**
 * Renders a geometry that disintegrates into rigid flakes which fly outward and burn at
 * the dissolving edge. Drive it with the controlled `progress` prop, or let it auto-play
 * (ping-ponging by default so it dissolves and re-forms).
 */
export function DissolvingMesh({
  geometry,
  progress,
  autoPlay,
  duration,
  loop,
  pingPong,
  paused,
  onProgress,
  onComplete,
  scatter,
  noiseScale,
  edgeWidth,
  spin,
  gravity,
  color,
  edgeColor,
  edgeStrength,
  roughness,
  metalness,
  seed = 1,
  normalBias = 0.6,
  ...groupProps
}: DissolvingMeshProps & GroupProps) {
  const prepared = useMemo(
    () => prepareErosionGeometry(geometry, { seed, normalBias }),
    [geometry, seed, normalBias],
  )

  // Created once; tunables are synced below so animation state survives prop changes.
  const material = useMemo(() => new ErosionMaterial(), [])
  const materials = useMemo(() => [material], [material])

  // Keep visual tunables in sync with props.
  useEffect(() => {
    if (color !== undefined) material.color.set(color)
    if (roughness !== undefined) material.roughness = roughness
    if (metalness !== undefined) material.metalness = metalness
    if (scatter !== undefined) material.scatter = scatter
    if (noiseScale !== undefined) material.noiseScale = noiseScale
    if (edgeWidth !== undefined) material.edgeWidth = edgeWidth
    if (spin !== undefined) material.spin = spin
    if (gravity !== undefined) material.gravity = gravity
    if (edgeColor !== undefined) material.edgeColor.set(edgeColor)
    if (edgeStrength !== undefined) material.edgeStrength = edgeStrength
  }, [
    material,
    color,
    roughness,
    metalness,
    scatter,
    noiseScale,
    edgeWidth,
    spin,
    gravity,
    edgeColor,
    edgeStrength,
  ])

  // Dispose the cloned geometry + material when they change or on unmount.
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => () => prepared.dispose(), [prepared])

  useDissolveController(materials, {
    progress,
    autoPlay,
    duration,
    loop,
    pingPong,
    paused,
    onProgress,
    onComplete,
  })

  return (
    <group {...groupProps}>
      <mesh geometry={prepared} material={material} />
    </group>
  )
}
