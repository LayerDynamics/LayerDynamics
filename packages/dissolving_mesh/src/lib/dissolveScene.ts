import { Mesh } from 'three'
import type { Material, MeshStandardMaterial, Object3D } from 'three'
import { ErosionMaterial } from '../material/ErosionMaterial'
import { prepareErosionGeometry } from './scatter'

/**
 * Copy the PBR-relevant fields of a loaded GLB material onto an ErosionMaterial so the
 * dissolved mesh keeps its original textures, colour and shading. Done field-by-field
 * (rather than `.copy`) so it is safe regardless of the source material subtype — an
 * unlit `MeshBasicMaterial` source won't poison `roughness`/`metalness` with `undefined`.
 */
export function adoptSurface(target: ErosionMaterial, source: Material): void {
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

export interface DissolveSceneOptions {
  /** Base seed; each mesh gets `seed + meshIndex` so flakes don't release in lock-step. */
  seed?: number
  /** Outward bias of each flake's launch direction (forwarded to prepareErosionGeometry). */
  normalBias?: number
}

export interface DissolveScene {
  /** A clone of the source tree with every mesh turned into a dissolving flake-mesh. */
  object: Object3D
  /** Every ErosionMaterial created, for the controller to drive and for disposal. */
  materials: ErosionMaterial[]
}

/**
 * Clone a loaded scene and turn every mesh into a dissolving flake-mesh: prepare its
 * geometry (non-indexed per-triangle attributes — this preserves the geometry `groups`,
 * so multi-material meshes keep rendering each region) and swap its material(s) for
 * ErosionMaterial(s) that adopt the original surface(s).
 *
 * Multi-material meshes are handled: a mesh whose `material` is an array gets one
 * ErosionMaterial per source material, kept as an array so the geometry's groups still
 * map each region to its own surface — nothing is collapsed to the first material.
 * (Standard `GLTFLoader` output splits multi-primitive meshes into separate single-
 * material meshes, so the array path mainly serves hand-built / non-standard scenes.)
 *
 * The source tree is never mutated — a deep clone is returned.
 */
export function buildDissolvingScene(
  source: Object3D,
  { seed = 1, normalBias = 0.6 }: DissolveSceneOptions = {},
): DissolveScene {
  const object = source.clone(true)
  const materials: ErosionMaterial[] = []
  let meshIndex = 0

  object.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh || !mesh.geometry) return

    mesh.geometry = prepareErosionGeometry(mesh.geometry, {
      seed: seed + meshIndex,
      normalBias,
    })

    const wasArray = Array.isArray(mesh.material)
    const sources = (wasArray ? mesh.material : [mesh.material]) as Material[]
    const erosionMaterials = sources.map((src) => {
      const material = new ErosionMaterial()
      if (src) adoptSurface(material, src)
      materials.push(material)
      return material
    })

    mesh.material = wasArray ? erosionMaterials : erosionMaterials[0]
    meshIndex++
  })

  return { object, materials }
}
