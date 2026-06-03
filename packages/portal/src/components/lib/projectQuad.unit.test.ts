import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { projectQuad } from './projectQuad'

describe('projectQuad', () => {
  it('projects a plane centered in front of the camera to the viewport center', () => {
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    cam.position.set(0, 0, 5)
    cam.lookAt(0, 0, 0)
    cam.updateMatrixWorld()
    const q = projectQuad({ width: 2, height: 2 }, new THREE.Matrix4().identity(), cam, 800, 800)
    expect(Math.abs(q.x + q.w / 2 - 400)).toBeLessThan(2)
    expect(q.visible).toBe(true)
    expect(q.w).toBeGreaterThan(0)
  })

  it('marks a plane far off to the side as not visible', () => {
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    cam.position.set(0, 0, 5)
    cam.lookAt(0, 0, 0)
    cam.updateMatrixWorld()
    const world = new THREE.Matrix4().makeTranslation(1000, 0, 0)
    const q = projectQuad({ width: 1, height: 1 }, world, cam, 800, 800)
    expect(q.visible).toBe(false)
  })
})
