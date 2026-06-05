import { type ThreeElements } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { Mesh } from 'three'
import type { ColorRepresentation } from 'three'
import { buildDissolvingScene } from '../lib/dissolveScene'
import { useDissolveController, type DissolveAnimation } from './useDissolveController'

export interface DissolvingGLTFProps extends DissolveAnimation {
  /** URL of the `.glb` / `.gltf` to load and dissolve. */
  url: string
  /**
   * Draco decoder directory (e.g. `/draco/`) for Draco-compressed assets. Passed to this
   * load only (no global loader state is mutated). Omit for uncompressed GLBs.
   */
  decoderPath?: string

  // --- effect tunables (forwarded to every mesh's ErosionMaterial) ---
  scatter?: number
  noiseScale?: number
  edgeWidth?: number
  spin?: number
  gravity?: number
  /** Override the GLB's surface colour. Omit to keep each mesh's original PBR colour. */
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
 * Load a GLB and dissolve its actual meshes into burning flakes while preserving the
 * asset's PBR materials. All meshes share one animation clock so the model dissolves as
 * a single object. Wrap in `<Suspense>` — `useGLTF` suspends while the asset loads.
 */
export function DissolvingGLTF({
  url,
  decoderPath,
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
}: DissolvingGLTFProps & GroupProps) {
  // Pass the Draco decoder path to this load only (drei applies it per-load when the
  // second arg is a string) instead of mutating useGLTF's global decoder path in render.
  const { scene } = useGLTF(url, decoderPath)

  const { object, materials } = useMemo(
    () => buildDissolvingScene(scene, { seed, normalBias }),
    [scene, seed, normalBias],
  )

  // Apply tunables without rebuilding the cloned scene on every prop tweak. `color` only
  // overrides when explicitly provided, so the GLB's own colours survive otherwise.
  useEffect(() => {
    for (const material of materials) {
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
    }
  }, [
    materials,
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

  // Dispose the cloned geometries + materials when the scene changes or on unmount.
  useEffect(
    () => () => {
      for (const material of materials) material.dispose()
      object.traverse((node) => {
        const mesh = node as Mesh
        if (mesh.isMesh) mesh.geometry?.dispose()
      })
    },
    [object, materials],
  )

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
      <primitive object={object} />
    </group>
  )
}
