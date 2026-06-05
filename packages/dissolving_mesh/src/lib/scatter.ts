import { BufferAttribute, BufferGeometry, Vector3 } from 'three'

export interface ErosionGeometryOptions {
  /** Seed for the deterministic per-triangle PRNG. Same seed -> identical flakes. */
  seed?: number
  /**
   * How strongly each flake's launch direction is pulled toward its outward face
   * normal. 1 = fly straight out along the surface normal, 0 = fully random
   * directions on the unit sphere. Defaults to a mostly-outward 0.6.
   */
  normalBias?: number
}

/**
 * A small, fully deterministic PRNG (mulberry32). We avoid `Math.random()` so the
 * generated flake directions/seeds are reproducible and unit-testable — the look of
 * a given mesh+seed never changes between runs.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniformly-distributed point on the unit sphere (Marsaglia method). */
function randomUnitVector(rand: () => number, out: Vector3): Vector3 {
  const z = rand() * 2 - 1
  const phi = rand() * Math.PI * 2
  const r = Math.sqrt(Math.max(0, 1 - z * z))
  return out.set(r * Math.cos(phi), r * Math.sin(phi), z)
}

/**
 * Prepare a geometry so it can disintegrate into rigid per-triangle "flakes".
 *
 * Why non-indexed + per-triangle (not per-vertex): an indexed mesh shares one vertex
 * between many triangles, so a per-vertex displacement would *stretch and tear* the
 * surface while keeping it connected (a melting look). The "vertices shoot away /
 * erodes into pieces" look needs each triangle to break off as a rigid chip. To get
 * that we `toNonIndexed()` (every triangle owns its 3 verts) and write the SAME
 * attributes onto all three corners of a triangle:
 *
 *  - `aScatter`  vec3  : that flake's launch direction (outward-biased random unit vec)
 *  - `aCentroid` vec3  : the triangle's centroid — the shader gates the dissolve on
 *                        this so all three corners cross the threshold together and the
 *                        flake flies off intact instead of distorting.
 *  - `aSeed`     float : a per-flake 0..1 jitter so flakes don't all release at once.
 *
 * The input geometry is never mutated — a non-indexed clone is returned.
 */
export function prepareErosionGeometry(
  source: BufferGeometry,
  { seed = 1, normalBias = 0.6 }: ErosionGeometryOptions = {},
): BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source.clone()
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()

  const position = geometry.getAttribute('position')
  const vertexCount = position.count
  if (vertexCount % 3 !== 0) {
    throw new Error(
      `prepareErosionGeometry expects a triangle list (vertex count divisible by 3); got ${vertexCount}.`,
    )
  }
  const triangleCount = vertexCount / 3

  const scatter = new Float32Array(vertexCount * 3)
  const centroid = new Float32Array(vertexCount * 3)
  const seeds = new Float32Array(vertexCount)

  const rand = mulberry32(seed)
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  const ab = new Vector3()
  const ac = new Vector3()
  const faceNormal = new Vector3()
  const randomDir = new Vector3()
  const dir = new Vector3()
  const mid = new Vector3()

  for (let t = 0; t < triangleCount; t++) {
    const i0 = t * 3
    a.fromBufferAttribute(position, i0)
    b.fromBufferAttribute(position, i0 + 1)
    c.fromBufferAttribute(position, i0 + 2)

    mid.copy(a).add(b).add(c).multiplyScalar(1 / 3)

    ab.copy(b).sub(a)
    ac.copy(c).sub(a)
    faceNormal.copy(ab).cross(ac)
    if (faceNormal.lengthSq() < 1e-12) faceNormal.set(0, 1, 0)
    faceNormal.normalize()

    randomUnitVector(rand, randomDir)
    dir
      .copy(faceNormal)
      .multiplyScalar(normalBias)
      .addScaledVector(randomDir, 1 - normalBias)
    if (dir.lengthSq() < 1e-12) dir.copy(faceNormal)
    dir.normalize()

    const flakeSeed = rand()

    for (let v = 0; v < 3; v++) {
      const vi = i0 + v
      scatter[vi * 3] = dir.x
      scatter[vi * 3 + 1] = dir.y
      scatter[vi * 3 + 2] = dir.z
      centroid[vi * 3] = mid.x
      centroid[vi * 3 + 1] = mid.y
      centroid[vi * 3 + 2] = mid.z
      seeds[vi] = flakeSeed
    }
  }

  geometry.setAttribute('aScatter', new BufferAttribute(scatter, 3))
  geometry.setAttribute('aCentroid', new BufferAttribute(centroid, 3))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  return geometry
}
