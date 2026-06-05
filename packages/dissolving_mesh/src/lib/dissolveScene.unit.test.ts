import { describe, it, expect } from 'vitest'
import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from 'three'
import { buildDissolvingScene, adoptSurface } from './dissolveScene'
import { ErosionMaterial } from '../material/ErosionMaterial'

describe('adoptSurface', () => {
  it('copies PBR fields from a standard source material', () => {
    const target = new ErosionMaterial()
    const source = new MeshStandardMaterial({
      color: new Color('#224466'),
      roughness: 0.2,
      metalness: 0.8,
    })
    source.transparent = true
    source.opacity = 0.5

    adoptSurface(target, source)

    expect(target.color.getHexString()).toBe('224466')
    expect(target.roughness).toBeCloseTo(0.2)
    expect(target.metalness).toBeCloseTo(0.8)
    expect(target.transparent).toBe(true)
    expect(target.opacity).toBeCloseTo(0.5)
  })

  it('does not poison roughness/metalness from an unlit source (no undefined leak)', () => {
    const target = new ErosionMaterial()
    const before = { roughness: target.roughness, metalness: target.metalness }
    adoptSurface(target, new MeshBasicMaterial({ color: new Color('#ff0000') }))

    expect(target.color.getHexString()).toBe('ff0000')
    // Basic material has no roughness/metalness — target keeps its own numeric defaults.
    expect(typeof target.roughness).toBe('number')
    expect(typeof target.metalness).toBe('number')
    expect(target.roughness).toBe(before.roughness)
    expect(target.metalness).toBe(before.metalness)
  })
})

describe('buildDissolvingScene', () => {
  it('clones the tree (never mutates the source) and swaps in an ErosionMaterial', () => {
    const source = new MeshStandardMaterial({ color: new Color('#10c040') })
    const mesh = new Mesh(new BoxGeometry(1, 1, 1), source)
    const root = new Group()
    root.add(mesh)

    const { object, materials } = buildDissolvingScene(root)

    // Source mesh untouched.
    expect(mesh.material).toBe(source)
    expect(mesh.geometry.index).not.toBeNull()

    // Clone got the dissolve material + non-indexed flake geometry + adopted colour.
    expect(object).not.toBe(root)
    const clonedMesh = object.children[0] as Mesh
    expect(clonedMesh.material).toBeInstanceOf(ErosionMaterial)
    expect((clonedMesh.material as ErosionMaterial).color.getHexString()).toBe('10c040')
    expect(clonedMesh.geometry.index).toBeNull()
    expect(clonedMesh.geometry.getAttribute('aScatter')).toBeTruthy()
    expect(materials).toHaveLength(1)
  })

  it('preserves a multi-material mesh: one ErosionMaterial per source, groups intact', () => {
    // A box with two material groups (two halves of its 12 triangles -> 36 verts).
    const geometry = new BoxGeometry(1, 1, 1).toNonIndexed()
    geometry.clearGroups()
    const half = geometry.getAttribute('position').count / 2
    geometry.addGroup(0, half, 0)
    geometry.addGroup(half, half, 1)

    const matA = new MeshStandardMaterial({ color: new Color('#ff0000') })
    const matB = new MeshStandardMaterial({ color: new Color('#0000ff') })
    const mesh = new Mesh(geometry, [matA, matB])
    const root = new Group()
    root.add(mesh)

    const { object, materials } = buildDissolvingScene(root)

    const clonedMesh = object.children[0] as Mesh
    expect(Array.isArray(clonedMesh.material)).toBe(true)
    const arr = clonedMesh.material as ErosionMaterial[]
    expect(arr).toHaveLength(2)
    expect(arr[0]).toBeInstanceOf(ErosionMaterial)
    expect(arr[1]).toBeInstanceOf(ErosionMaterial)
    // Each region adopted its own colour — nothing collapsed to the first material.
    expect(arr[0].color.getHexString()).toBe('ff0000')
    expect(arr[1].color.getHexString()).toBe('0000ff')
    // Both materials are tracked for the controller / disposal.
    expect(materials).toHaveLength(2)
    // The geometry groups survived the non-indexing so both regions still render.
    expect(clonedMesh.geometry.groups).toHaveLength(2)
    expect(clonedMesh.geometry.groups[1].materialIndex).toBe(1)
  })

  it('seeds each mesh distinctly so multi-mesh trees do not release in lock-step', () => {
    const root = new Group()
    root.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()))
    root.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()))

    const { object, materials } = buildDissolvingScene(root, { seed: 1 })
    expect(materials).toHaveLength(2)

    const [a, b] = object.children as Mesh[]
    const sa = a.geometry.getAttribute('aScatter').array
    const sb = b.geometry.getAttribute('aScatter').array
    // Identical geometry but seed+0 vs seed+1 -> different flake directions.
    expect(Array.from(sa)).not.toEqual(Array.from(sb))
  })
})
