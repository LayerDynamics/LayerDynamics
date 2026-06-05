import { type ThreeElements } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { Mesh, MeshStandardMaterial } from 'three'
import type { ColorRepresentation, Material, Object3D } from 'three'
import { ErosionMaterial } from '../material/ErosionMaterial'
import { prepareErosionGeometry } from '../lib/scatter'
import { useDissolveController, type DissolveAnimation } from './useDissolveController'

export interface DissolvingGLTFProps extends DissolveAnimation {
  /** URL of the `.glb` / `.gltf` to load and dissolve. */
  url: string
  /**
   * Draco decoder directory (e.g. `/draco/`) for Draco-compressed assets. Set once and
   * applied before the asset loads. Omit for uncompressed GLBs.
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
 * Copy the PBR-relevant fields of a loaded GLB material onto an ErosionMaterial so the
 * dissolved mesh keeps its original textures, colour and shading. Done field-by-field
 * (rather than `.copy`) so it is safe regardless of the source material subtype — an
 * unlit `MeshBasicMaterial` source won't poison `roughness`/`metalness` with `undefined`.
 */
function adoptSurface(target: ErosionMaterial, source: Material): void {
  const std = source as MeshStandardMaterial
  if (std.color) target.color.copy(std.color)
  if (std.emissive) target.emissive.copy(std.emissive)
  if (typeof std.emissiveIntensity === 'number') target.emissiveIntensity = std.emissiveIntensity
  if (typeof std.roughness === 'number') target.roughness = std.roughness
  if (typeof std.metalness === 'number') target.metalness = std.metalness
  if (std.map) target.map = std.map
  if (std.normalMap) target.normalMap = std.normalMap
  if (std.roughnessMap) target.roughnessMap = std.roughnessMap
  if (std.metalnessMap) target.metalnessMap = std.metalnessMap
  if (std.emissiveMap) target.emissiveMap = std.emissiveMap
  if (std.aoMap) target.aoMap = std.aoMap
  if (std.alphaMap) target.alphaMap = std.alphaMap
  if (typeof std.flatShading === 'boolean') target.flatShading = std.flatShading
  target.vertexColors = source.vertexColors
  target.transparent = source.transparent
  target.opacity = source.opacity
  target.side = source.side
  target.needsUpdate = true
}

interface BuiltScene {
  object: Object3D
  materials: ErosionMaterial[]
}

/**
 * Clone the loaded scene and turn every mesh into a dissolving flake-mesh: prepare its
 * geometry (non-indexed per-triangle attributes) and swap its material for an
 * ErosionMaterial that adopts the original surface. Each mesh gets a distinct seed so
 * their flakes don't release in lock-step.
 */
function buildDissolvingScene(source: Object3D, seed: number, normalBias: number): BuiltScene {
  const object = source.clone(true)
  const materials: ErosionMaterial[] = []
  let index = 0

  object.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh || !mesh.geometry) return

    const sources = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const material = new ErosionMaterial()
    const first = sources[0]
    if (first) adoptSurface(material, first)

    mesh.geometry = prepareErosionGeometry(mesh.geometry, { seed: seed + index, normalBias })
    mesh.material = material
    materials.push(material)
    index++
  })

  return { object, materials }
}

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
  // Must be configured before the loader reads it, so set it before useGLTF below.
  if (decoderPath) useGLTF.setDecoderPath(decoderPath)

  const { scene } = useGLTF(url)

  const { object, materials } = useMemo(
    () => buildDissolvingScene(scene, seed, normalBias),
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
