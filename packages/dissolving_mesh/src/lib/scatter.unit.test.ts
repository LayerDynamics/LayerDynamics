import { describe, it, expect } from 'vitest'
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, PlaneGeometry, Vector3 } from 'three'
import { prepareErosionGeometry } from './scatter'

describe('prepareErosionGeometry', () => {
  it('returns a non-indexed triangle list with the erosion attributes', () => {
    const geo = prepareErosionGeometry(new BoxGeometry(1, 1, 1))

    expect(geo.index).toBeNull()
    const position = geo.getAttribute('position')
    expect(position.count % 3).toBe(0)

    const scatter = geo.getAttribute('aScatter')
    const centroid = geo.getAttribute('aCentroid')
    const seed = geo.getAttribute('aSeed')

    expect(scatter.itemSize).toBe(3)
    expect(centroid.itemSize).toBe(3)
    expect(seed.itemSize).toBe(1)
    expect(scatter.count).toBe(position.count)
    expect(centroid.count).toBe(position.count)
    expect(seed.count).toBe(position.count)
  })

  it('writes identical per-triangle attributes onto all three corners (rigid flakes)', () => {
    const geo = prepareErosionGeometry(new BoxGeometry(1, 1, 1))
    const scatter = geo.getAttribute('aScatter')
    const centroid = geo.getAttribute('aCentroid')
    const seed = geo.getAttribute('aSeed')

    for (let i = 0; i < scatter.count; i += 3) {
      for (let v = 1; v < 3; v++) {
        expect(scatter.getX(i)).toBe(scatter.getX(i + v))
        expect(scatter.getY(i)).toBe(scatter.getY(i + v))
        expect(scatter.getZ(i)).toBe(scatter.getZ(i + v))
        expect(centroid.getX(i)).toBe(centroid.getX(i + v))
        expect(centroid.getY(i)).toBe(centroid.getY(i + v))
        expect(centroid.getZ(i)).toBe(centroid.getZ(i + v))
        expect(seed.getX(i)).toBe(seed.getX(i + v))
      }
    }
  })

  it('gives every flake a unit-length scatter direction', () => {
    const geo = prepareErosionGeometry(new BoxGeometry(2, 1, 3, 2, 2, 2))
    const scatter = geo.getAttribute('aScatter')
    const v = new Vector3()
    for (let i = 0; i < scatter.count; i += 3) {
      v.fromBufferAttribute(scatter, i)
      expect(v.length()).toBeCloseTo(1, 5)
    }
  })

  it('sets aCentroid to the average of each triangle\'s three vertices', () => {
    const geo = prepareErosionGeometry(new PlaneGeometry(2, 2))
    const position = geo.getAttribute('position')
    const centroid = geo.getAttribute('aCentroid')
    const a = new Vector3()
    const b = new Vector3()
    const c = new Vector3()
    const mid = new Vector3()
    const stored = new Vector3()
    for (let i = 0; i < position.count; i += 3) {
      a.fromBufferAttribute(position, i)
      b.fromBufferAttribute(position, i + 1)
      c.fromBufferAttribute(position, i + 2)
      mid.copy(a).add(b).add(c).multiplyScalar(1 / 3)
      stored.fromBufferAttribute(centroid, i)
      expect(stored.x).toBeCloseTo(mid.x, 5)
      expect(stored.y).toBeCloseTo(mid.y, 5)
      expect(stored.z).toBeCloseTo(mid.z, 5)
    }
  })

  it('is deterministic for a given seed and varies across seeds', () => {
    const a = prepareErosionGeometry(new BoxGeometry(1, 1, 1), { seed: 7 })
    const b = prepareErosionGeometry(new BoxGeometry(1, 1, 1), { seed: 7 })
    const c = prepareErosionGeometry(new BoxGeometry(1, 1, 1), { seed: 8 })

    const sa = a.getAttribute('aScatter').array
    const sb = b.getAttribute('aScatter').array
    const sc = c.getAttribute('aScatter').array

    expect(Array.from(sa)).toEqual(Array.from(sb))
    expect(Array.from(sa)).not.toEqual(Array.from(sc))
  })

  it('does not mutate the source geometry', () => {
    const source = new BoxGeometry(1, 1, 1)
    expect(source.index).not.toBeNull()
    prepareErosionGeometry(source)
    expect(source.index).not.toBeNull()
    expect(source.getAttribute('aScatter')).toBeUndefined()
  })

  it('throws when handed a geometry that is not a triangle list', () => {
    // 5 vertices, non-indexed -> count is not a multiple of 3.
    const bad = new BufferGeometry()
    bad.setAttribute(
      'position',
      new Float32BufferAttribute(new Float32Array(5 * 3), 3),
    )
    expect(() => prepareErosionGeometry(bad)).toThrow(/triangle list/)
  })
})
