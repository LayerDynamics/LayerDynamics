// Source geometry + precomputed per-point attributes for the mesh-processing
// showcase (src/three/MeshProcessing.tsx).
//
// Everything here is pure (no React / no three scene-graph state) so it can run
// once in a useMemo and feed a single Points buffer that the shader morphs
// through the pipeline stages. The *source* geometry is intentionally behind
// `createSourceGeometry()` so a real Blender/GLB mesh can replace the procedural
// placeholder later without touching the attribute pipeline or the renderer:
// any non-indexed-or-indexed BufferGeometry with a `position` attribute works.

import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  TorusKnotGeometry,
  Vector3,
} from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Tunables for the showcase. Point count is the single biggest perf lever. */
export const SOURCE = {
  /** Sampled surface points. Dense enough that the point cloud still reads as
   *  the logo's silhouette rather than a soft blob. */
  pointCount: 24000,
  /** k for the feature-space segmentation (position + normal). */
  segments: 7,
  /** Voxel grid resolution per axis for the decimation/quantization stage. */
  decimateGrid: 14,
  /** Variation displacement amplitude (world units along the normal). */
  varyAmp: 0.55,
  /** Silhouette emphasis: the source logo is an extruded plate (thin in Z after
   *  orientation), so its side walls trace the logo outline + internal layer
   *  steps (normals perpendicular to Z) while the big flat faces just fill area.
   *  We keep wall/edge samples densely and accept flat-face samples at only
   *  `interiorKeep` probability, so the point cloud reads as the logo shape
   *  instead of a filled blob. `edgeGamma` shapes the falloff. */
  interiorKeep: 0.16,
  edgeGamma: 1.0,
} as const

/** Per-point attribute buffers consumed by the Points shader, all packed for
 *  direct upload as instanced/standard BufferAttributes. */
export interface ProcessAttributes {
  count: number
  /** Sampled surface position (the point cloud / mesh-surface stage). */
  surface: Float32Array
  /** Unit surface normal at each sample. */
  normal: Float32Array
  /** Per-segment RGB from feature-space clustering (position + normal). */
  segColor: Float32Array
  /** Position snapped to its voxel-cell centroid (decimation / remesh stage). */
  decimated: Float32Array
  /** Coherent variant position: surface displaced along normal by fbm noise. */
  variation: Float32Array
  /** Per-point [0,1) used to stagger reveals so stages cascade, not snap. */
  random: Float32Array
  /** Bounding radius of the surface samples, for camera/label framing. */
  radius: number
}

/**
 * The procedural placeholder solid. A torus knot reads unmistakably as a
 * machined/CAD-like part (clean closed surface, rich normal variation that makes
 * the segmentation stage legible) — a good stand-in until a real scanned mesh
 * drops in. Swap the body of this function to `useGLTF`-loaded geometry later.
 */
export function createSourceGeometry(): BufferGeometry {
  const geo = new TorusKnotGeometry(1.05, 0.34, 240, 36)
  geo.center()
  return geo
}

/**
 * Build one clean, sampler-ready BufferGeometry from a loaded glTF scene — the
 * real LayerDynamics logo, which exports as a 17-body CAD solid (each `Body*` a
 * separate node with its own transform). Merges every mesh with its world
 * matrix baked in, normalizes the result to a consistent size centered on the
 * origin, and orients the logo's broad face toward the camera so it reads
 * head-on. This is the production swap for `createSourceGeometry()` — feed its
 * output straight into `buildProcessAttributes`.
 */
export function prepareLogoGeometry(root: Object3D, targetRadius = 1.55): BufferGeometry {
  root.updateWorldMatrix(true, true)

  const parts: BufferGeometry[] = []
  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    // Bake the node's world transform into a clone, then flatten to a
    // non-indexed triangle soup BEFORE stripping attributes — the source prims
    // are indexed, so dropping the index off the raw position array would
    // scramble the triangles.
    const baked = mesh.geometry.clone()
    baked.applyMatrix4(mesh.matrixWorld)
    const flat = baked.index ? baked.toNonIndexed() : baked
    const part = new BufferGeometry()
    part.setAttribute('position', flat.getAttribute('position'))
    const n = flat.getAttribute('normal')
    if (n) part.setAttribute('normal', n)
    parts.push(part)
  })

  if (parts.length === 0) throw new Error('prepareLogoGeometry: no meshes in scene')

  const merged = mergeGeometries(parts, false)
  if (!merged) throw new Error('prepareLogoGeometry: merge failed (attribute mismatch)')
  if (!merged.getAttribute('normal')) merged.computeVertexNormals()

  // Center on the origin.
  merged.computeBoundingBox()
  const box = merged.boundingBox!
  const center = new Vector3()
  const size = new Vector3()
  box.getCenter(center)
  box.getSize(size)
  merged.translate(-center.x, -center.y, -center.z)

  // Rotate the thinnest axis to be the depth axis (+Z) so the logo faces the
  // camera flat-on instead of edge-on.
  if (size.y <= size.x && size.y <= size.z) {
    merged.rotateX(-Math.PI / 2)
  } else if (size.x <= size.y && size.x <= size.z) {
    merged.rotateY(Math.PI / 2)
  }

  // Normalize to a consistent bounding-sphere radius so framing/point-size
  // tuning is independent of the source model's authored scale.
  merged.computeBoundingSphere()
  const r = merged.boundingSphere!.radius || 1
  const s = targetRadius / r
  merged.scale(s, s, s)
  merged.computeBoundingSphere()

  return merged
}

// --- deterministic helpers (seeded so the showcase looks identical each load) ---

/** mulberry32 PRNG — deterministic, fast, good enough for sampling/seeding. */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Integer hash → [0,1), for lattice value noise. */
function hash3(ix: number, iy: number, iz: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/** Trilinear value noise on the integer lattice, range ~[0,1]. */
function valueNoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const fx = smoothstep(x - ix)
  const fy = smoothstep(y - iy)
  const fz = smoothstep(z - iz)
  const c000 = hash3(ix, iy, iz)
  const c100 = hash3(ix + 1, iy, iz)
  const c010 = hash3(ix, iy + 1, iz)
  const c110 = hash3(ix + 1, iy + 1, iz)
  const c001 = hash3(ix, iy, iz + 1)
  const c101 = hash3(ix + 1, iy, iz + 1)
  const c011 = hash3(ix, iy + 1, iz + 1)
  const c111 = hash3(ix + 1, iy + 1, iz + 1)
  const x00 = c000 + (c100 - c000) * fx
  const x10 = c010 + (c110 - c010) * fx
  const x01 = c001 + (c101 - c001) * fx
  const x11 = c011 + (c111 - c011) * fx
  const y0 = x00 + (x10 - x00) * fy
  const y1 = x01 + (x11 - x01) * fy
  return y0 + (y1 - y0) * fz
}

/** Fractal (multi-octave) value noise centered roughly on 0. */
function fbm(x: number, y: number, z: number): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  for (let o = 0; o < 4; o++) {
    sum += amp * (valueNoise(x * freq, y * freq, z * freq) - 0.5) * 2
    freq *= 2.03
    amp *= 0.5
  }
  return sum
}

/** HSL→RGB (h,s,l in [0,1]) for distinct, brand-adjacent segment colors. */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hk = (n: number) => {
    let t = h + n
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [hk(1 / 3), hk(0), hk(-1 / 3)]
}

/**
 * Sample the surface and precompute every per-point attribute the shader needs.
 * Runs once. Deterministic given the same geometry + counts.
 */
export function buildProcessAttributes(
  geometry: BufferGeometry,
  count = SOURCE.pointCount,
): ProcessAttributes {
  const mesh = new Mesh(geometry, new MeshBasicMaterial())
  const sampler = new MeshSurfaceSampler(mesh).build()

  const surface = new Float32Array(count * 3)
  const normal = new Float32Array(count * 3)
  const random = new Float32Array(count)

  const pos = new Vector3()
  const nrm = new Vector3()
  const rng = makeRng(0x5eed1234)

  // Weighted rejection sampling biased toward edges/feature walls (see SOURCE).
  // After orientation the plate is thin in Z, so points whose normal is
  // perpendicular to Z (|n.z| small) lie on the side walls that trace the logo
  // outline + layer steps — keep those; thin the flat ±Z faces.
  let radius = 0
  let i = 0
  let guard = 0
  const maxTries = count * 40
  while (i < count && guard < maxTries) {
    guard++
    sampler.sample(pos, nrm)
    const edgeness = 1 - Math.abs(nrm.z) // 1 on side walls, ~0 on flat faces
    const keepProb = SOURCE.interiorKeep + (1 - SOURCE.interiorKeep) * Math.pow(edgeness, SOURCE.edgeGamma)
    if (rng() > keepProb) continue
    const i3 = i * 3
    surface[i3] = pos.x
    surface[i3 + 1] = pos.y
    surface[i3 + 2] = pos.z
    normal[i3] = nrm.x
    normal[i3 + 1] = nrm.y
    normal[i3 + 2] = nrm.z
    random[i] = rng()
    radius = Math.max(radius, pos.length())
    i++
  }
  // Safety: if rejection under-filled (degenerate normals), top up unconditionally
  // so every buffer slot holds a real sample.
  for (; i < count; i++) {
    sampler.sample(pos, nrm)
    const i3 = i * 3
    surface[i3] = pos.x
    surface[i3 + 1] = pos.y
    surface[i3 + 2] = pos.z
    normal[i3] = nrm.x
    normal[i3 + 1] = nrm.y
    normal[i3 + 2] = nrm.z
    random[i] = rng()
    radius = Math.max(radius, pos.length())
  }

  const segColor = computeSegmentation(surface, normal, count, SOURCE.segments, rng)
  const decimated = computeDecimation(surface, count, SOURCE.decimateGrid, radius)
  const variation = computeVariation(surface, normal, count)

  return { count, surface, normal, segColor, decimated, variation, random, radius }
}

/**
 * Feature-space segmentation: k-means over a per-point feature vector that
 * combines position AND surface normal, so clusters track genuine surface
 * structure (faces/lobes that share orientation), not just spatial proximity.
 * Honest to caption as normal+spatial segmentation. Returns a packed RGB buffer.
 */
function computeSegmentation(
  surface: Float32Array,
  normal: Float32Array,
  count: number,
  k: number,
  rng: () => number,
): Float32Array {
  // Feature = [pos.xyz, normalWeight * normal.xyz]. Normals are unit-length, so
  // weight them up to ~position scale so orientation actually drives clustering.
  const NW = 1.6
  const feat = new Float32Array(count * 6)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const i6 = i * 6
    feat[i6] = surface[i3]
    feat[i6 + 1] = surface[i3 + 1]
    feat[i6 + 2] = surface[i3 + 2]
    feat[i6 + 3] = normal[i3] * NW
    feat[i6 + 4] = normal[i3 + 1] * NW
    feat[i6 + 5] = normal[i3 + 2] * NW
  }

  // Seed centroids from random points (deterministic rng).
  const centroids = new Float32Array(k * 6)
  for (let c = 0; c < k; c++) {
    const src = (Math.floor(rng() * count) % count) * 6
    for (let d = 0; d < 6; d++) centroids[c * 6 + d] = feat[src + d]
  }

  const assign = new Int32Array(count)
  for (let iter = 0; iter < 10; iter++) {
    // Assignment step.
    for (let i = 0; i < count; i++) {
      const f = i * 6
      let best = 0
      let bestD = Infinity
      for (let c = 0; c < k; c++) {
        const cc = c * 6
        let d = 0
        for (let j = 0; j < 6; j++) {
          const diff = feat[f + j] - centroids[cc + j]
          d += diff * diff
        }
        if (d < bestD) {
          bestD = d
          best = c
        }
      }
      assign[i] = best
    }
    // Update step.
    const sums = new Float64Array(k * 6)
    const counts = new Int32Array(k)
    for (let i = 0; i < count; i++) {
      const c = assign[i]
      counts[c]++
      const f = i * 6
      const cc = c * 6
      for (let j = 0; j < 6; j++) sums[cc + j] += feat[f + j]
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue
      const cc = c * 6
      for (let j = 0; j < 6; j++) centroids[cc + j] = sums[cc + j] / counts[c]
    }
  }

  // Map cluster id → a distinct color, fanned across a warm band around the coral
  // accent (#ff6750 ≈ hue 0.025): pink-red → coral → amber, so the segments stay
  // distinguishable without leaving the black/white/coral scheme.
  const palette: Array<[number, number, number]> = []
  for (let c = 0; c < k; c++) {
    const h = (0.96 + (c / k) * 0.13) % 1 // pink-red → coral → amber
    palette.push(hslToRgb(h, 0.62, 0.58))
  }

  const segColor = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const col = palette[assign[i]]
    const i3 = i * 3
    segColor[i3] = col[0]
    segColor[i3 + 1] = col[1]
    segColor[i3 + 2] = col[2]
  }
  return segColor
}

/**
 * Decimation/quantization target: snap each surface point to the centroid of its
 * voxel cell on a coarse grid. Points collapsing onto these centroids reads as a
 * genuine remesh/decimation (vertex clustering — the classic decimation method),
 * not a cosmetic blur.
 */
function computeDecimation(
  surface: Float32Array,
  count: number,
  grid: number,
  radius: number,
): Float32Array {
  const extent = radius * 1.02
  const cell = (2 * extent) / grid
  const inv = 1 / cell

  const sums = new Map<number, { x: number; y: number; z: number; n: number }>()
  const keyOf = (x: number, y: number, z: number) => {
    const gx = Math.min(grid - 1, Math.max(0, Math.floor((x + extent) * inv)))
    const gy = Math.min(grid - 1, Math.max(0, Math.floor((y + extent) * inv)))
    const gz = Math.min(grid - 1, Math.max(0, Math.floor((z + extent) * inv)))
    return (gx * grid + gy) * grid + gz
  }

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const key = keyOf(surface[i3], surface[i3 + 1], surface[i3 + 2])
    const acc = sums.get(key)
    if (acc) {
      acc.x += surface[i3]
      acc.y += surface[i3 + 1]
      acc.z += surface[i3 + 2]
      acc.n++
    } else {
      sums.set(key, { x: surface[i3], y: surface[i3 + 1], z: surface[i3 + 2], n: 1 })
    }
  }

  const decimated = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const acc = sums.get(keyOf(surface[i3], surface[i3 + 1], surface[i3 + 2]))!
    decimated[i3] = acc.x / acc.n
    decimated[i3 + 1] = acc.y / acc.n
    decimated[i3 + 2] = acc.z / acc.n
  }
  return decimated
}

/**
 * Variation/generation target: displace each surface point along its normal by a
 * low-frequency fbm field, producing a coherent *variant* of the form (a blobby,
 * organically deformed sibling) rather than a random point explosion — so the
 * generative stage reads as "new geometry from the learned shape," which is the
 * honest visual metaphor for a generative step.
 */
function computeVariation(surface: Float32Array, normal: Float32Array, count: number): Float32Array {
  const variation = new Float32Array(count * 3)
  const FREQ = 1.35
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const x = surface[i3]
    const y = surface[i3 + 1]
    const z = surface[i3 + 2]
    // Two decorrelated fbm lobes give an asymmetric, believable variant.
    const d =
      fbm(x * FREQ, y * FREQ, z * FREQ) * 0.7 +
      fbm(x * FREQ * 0.5 + 11.3, y * FREQ * 0.5 - 4.1, z * FREQ * 0.5 + 7.7) * 0.45
    const amp = SOURCE.varyAmp * d
    variation[i3] = x + normal[i3] * amp
    variation[i3 + 1] = y + normal[i3 + 1] * amp
    variation[i3 + 2] = z + normal[i3 + 2] * amp
  }
  return variation
}
