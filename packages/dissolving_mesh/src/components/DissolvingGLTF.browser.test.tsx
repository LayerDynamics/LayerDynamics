import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { Suspense } from 'react'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusKnotGeometry,
} from 'three'
import type { Scene } from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { DissolvingGLTF } from './DissolvingGLTF'
import { ErosionMaterial } from '../material/ErosionMaterial'
import { ER_VERTEX_TRANSFORM_SITE, ER_FRAGMENT_DISCARD_SITE } from '../material/erosion.glsl'

afterEach(() => cleanup())

/**
 * Build a genuine GLB in-memory (no asset file) so the test round-trips through the real
 * GLTFExporter -> GLB bytes -> GLTFLoader path that `useGLTF` runs. The source mesh
 * carries a recognisable green PBR material so we can prove the surface is preserved.
 */
let glbUrl: string
const SOURCE_COLOR = 0x33cc66

beforeAll(async () => {
  const mesh = new Mesh(
    new TorusKnotGeometry(0.8, 0.26, 80, 16),
    new MeshStandardMaterial({ color: new Color(SOURCE_COLOR), roughness: 0.3, metalness: 0.5 }),
  )
  const root = new Group()
  root.add(mesh)

  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    new GLTFExporter().parse(
      root,
      (result) => resolve(result as ArrayBuffer),
      (error) => reject(error),
      { binary: true },
    )
  })
  glbUrl = URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }))
})

function collectErosionMaterials(scene: Scene): ErosionMaterial[] {
  const found: ErosionMaterial[] = []
  scene.traverse((object) => {
    const material = (object as Mesh).material
    if (material instanceof ErosionMaterial) found.push(material)
  })
  return found
}

describe('DissolvingGLTF', () => {
  it('loads a real GLB, swaps its meshes to the dissolve material, and compiles the effect', async () => {
    let scene: Scene | undefined
    const screen = await render(
      <Canvas onCreated={(state) => (scene = state.scene)}>
        <ambientLight />
        <Suspense fallback={null}>
          <DissolvingGLTF url={glbUrl} autoPlay scatter={2} />
        </Suspense>
      </Canvas>,
    )

    await expect
      .poll(() => screen.container.querySelector('canvas'), { timeout: 3000 })
      .toBeTruthy()

    // Wait for the asset to load + the dissolve material to compile on the real GPU.
    // `userData.shader` is set in onBeforeCompile, which three r0.184 invokes ONCE PER
    // MATERIAL (gated by the per-material `materialProperties.programs` map —
    // WebGLRenderer.js:2178-2213), even when two materials reuse the same refcounted
    // compiled program. So `every(m => m.userData.shader)` is sound for multi-mesh GLBs
    // too — each material gets its own onBeforeCompile call and its own uniforms. (This
    // differs from much older three, where instances sharing a program shared uniforms.)
    let materials: ErosionMaterial[] = []
    await expect
      .poll(
        () => {
          materials = scene ? collectErosionMaterials(scene) : []
          return materials.length > 0 && materials.every((m) => m.userData.shader)
        },
        { timeout: 10000 },
      )
      .toBe(true)

    // The GLB's green PBR surface was adopted onto the ErosionMaterial.
    expect(materials[0].color.getHex()).toBe(SOURCE_COLOR)
    expect(materials[0].roughness).toBeCloseTo(0.3)
    expect(materials[0].metalness).toBeCloseTo(0.5)

    // The dissolve effect is genuinely injected into the compiled program.
    const shader = materials[0].userData.shader as {
      vertexShader: string
      fragmentShader: string
    }
    expect(shader.vertexShader).toContain(ER_VERTEX_TRANSFORM_SITE)
    expect(shader.fragmentShader).toContain(ER_FRAGMENT_DISCARD_SITE)
  })
})
