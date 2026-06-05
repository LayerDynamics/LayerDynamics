import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { BoxGeometry } from 'three'
import type { Mesh, Scene } from 'three'
import { DissolvingMesh } from './DissolvingMesh'
import { ErosionMaterial } from '../material/ErosionMaterial'
import {
  ER_VERTEX_MARKER,
  ER_FRAGMENT_MARKER,
  ER_VERTEX_NORMAL_SITE,
  ER_VERTEX_TRANSFORM_SITE,
  ER_FRAGMENT_DISCARD_SITE,
  ER_FRAGMENT_EMISSIVE_SITE,
} from '../material/erosion.glsl'

afterEach(() => cleanup())

function findErosionMaterial(scene: Scene): ErosionMaterial | undefined {
  let found: ErosionMaterial | undefined
  scene.traverse((object) => {
    const material = (object as Mesh).material
    if (material instanceof ErosionMaterial) found = material
  })
  return found
}

describe('DissolvingMesh', () => {
  it('smoke-mounts and compiles the dissolve effect into the real WebGL program', async () => {
    const geometry = new BoxGeometry(1, 1, 1)
    let scene: Scene | undefined
    const screen = await render(
      <Canvas onCreated={(state) => (scene = state.scene)}>
        <ambientLight />
        <DissolvingMesh geometry={geometry} autoPlay />
      </Canvas>,
    )

    await expect
      .poll(() => screen.container.querySelector('canvas'), { timeout: 3000 })
      .toBeTruthy()

    // The program only carries our injection once three has compiled the material on a
    // real GPU pass — so a captured shader proves onBeforeCompile actually ran AND every
    // chunk token matched (a wrong token would have thrown in injectErosion).
    let material: ErosionMaterial | undefined
    await expect
      .poll(
        () => {
          material = scene ? findErosionMaterial(scene) : undefined
          return material?.userData.shader
        },
        { timeout: 8000 },
      )
      .toBeTruthy()

    const shader = material!.userData.shader as {
      vertexShader: string
      fragmentShader: string
    }

    expect(shader.vertexShader).toContain(ER_VERTEX_MARKER)
    expect(shader.vertexShader).toContain(ER_VERTEX_NORMAL_SITE)
    expect(shader.vertexShader).toContain(ER_VERTEX_TRANSFORM_SITE)
    expect(shader.fragmentShader).toContain(ER_FRAGMENT_MARKER)
    expect(shader.fragmentShader).toContain(ER_FRAGMENT_DISCARD_SITE)
    expect(shader.fragmentShader).toContain(ER_FRAGMENT_EMISSIVE_SITE)
  })

  it('renders a fully-dissolved frame (controlled progress = 1) without throwing', async () => {
    const geometry = new BoxGeometry(1, 1, 1)
    let scene: Scene | undefined
    const screen = await render(
      <Canvas onCreated={(state) => (scene = state.scene)}>
        <ambientLight />
        <DissolvingMesh geometry={geometry} progress={1} scatter={3} />
      </Canvas>,
    )

    await expect
      .poll(() => screen.container.querySelector('canvas'), { timeout: 3000 })
      .toBeTruthy()

    await expect
      .poll(() => (scene ? findErosionMaterial(scene)?.progress : undefined), { timeout: 8000 })
      .toBe(1)
  })

  it('fires onComplete exactly once when controlled progress is driven to 1', async () => {
    const geometry = new BoxGeometry(1, 1, 1)
    let completeCalls = 0
    const screen = await render(
      <Canvas>
        <ambientLight />
        <DissolvingMesh geometry={geometry} progress={1} onComplete={() => completeCalls++} />
      </Canvas>,
    )

    await expect
      .poll(() => screen.container.querySelector('canvas'), { timeout: 3000 })
      .toBeTruthy()

    // It fires...
    await expect.poll(() => completeCalls, { timeout: 8000 }).toBeGreaterThanOrEqual(1)
    // ...and the latch keeps it from re-firing every frame while progress stays at 1.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(completeCalls).toBe(1)
  })
})
