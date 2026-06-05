import { describe, it, expect } from 'vitest'
import { Color } from 'three'
import type { WebGLProgramParametersWithUniforms } from 'three'
import { ErosionMaterial } from './ErosionMaterial'
import {
  injectErosion,
  ER_VERTEX_MARKER,
  ER_FRAGMENT_MARKER,
  ER_VERTEX_NORMAL_SITE,
  ER_VERTEX_TRANSFORM_SITE,
  ER_FRAGMENT_DISCARD_SITE,
  ER_FRAGMENT_EMISSIVE_SITE,
  type ErosionUniforms,
} from './erosion.glsl'

/** A stand-in for the MeshStandardMaterial shader three hands to onBeforeCompile. */
function fakeShader(): WebGLProgramParametersWithUniforms {
  return {
    uniforms: {},
    vertexShader: [
      'void main() {',
      '#include <common>',
      '#include <beginnormal_vertex>',
      '#include <begin_vertex>',
      '}',
    ].join('\n'),
    fragmentShader: [
      'void main() {',
      '#include <common>',
      '#include <clipping_planes_fragment>',
      '#include <emissivemap_fragment>',
      '}',
    ].join('\n'),
  } as unknown as WebGLProgramParametersWithUniforms
}

function uniforms(): ErosionUniforms {
  return {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uScatter: { value: 1 },
    uNoiseScale: { value: 1 },
    uEdgeWidth: { value: 0.1 },
    uSpin: { value: 1 },
    uGravity: { value: 0.5 },
    uEdgeColor: { value: new Color() },
    uEdgeStrength: { value: 1 },
  }
}

describe('injectErosion', () => {
  it('patches every injection site and binds the uniforms', () => {
    const shader = fakeShader()
    const u = uniforms()
    injectErosion(shader, u)

    expect(shader.vertexShader).toContain(ER_VERTEX_MARKER)
    expect(shader.vertexShader).toContain(ER_VERTEX_NORMAL_SITE)
    expect(shader.vertexShader).toContain(ER_VERTEX_TRANSFORM_SITE)
    // The original chunk includes must still be present (we append, not replace-away).
    expect(shader.vertexShader).toContain('#include <begin_vertex>')

    expect(shader.fragmentShader).toContain(ER_FRAGMENT_MARKER)
    expect(shader.fragmentShader).toContain(ER_FRAGMENT_DISCARD_SITE)
    expect(shader.fragmentShader).toContain(ER_FRAGMENT_EMISSIVE_SITE)

    expect(shader.uniforms.uProgress).toBe(u.uProgress)
    expect(shader.uniforms.uEdgeColor).toBe(u.uEdgeColor)
  })

  it('throws (never silently no-ops) when an expected chunk token is missing', () => {
    const shader = fakeShader()
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '')
    expect(() => injectErosion(shader, uniforms())).toThrow(/begin_vertex/)
  })
})

describe('ErosionMaterial', () => {
  it('exposes sensible defaults through its accessors', () => {
    const mat = new ErosionMaterial()
    expect(mat.progress).toBe(0)
    expect(mat.scatter).toBeCloseTo(1.5)
    expect(mat.noiseScale).toBeCloseTo(1.2)
    expect(mat.edgeWidth).toBeCloseTo(0.15)
    expect(mat.spin).toBeCloseTo(2)
    expect(mat.gravity).toBeCloseTo(0.6)
    expect(mat.edgeStrength).toBeCloseTo(2.5)
    expect(mat.edgeColor).toBeInstanceOf(Color)
  })

  it('applies constructor params and keeps standard params on the base material', () => {
    const mat = new ErosionMaterial({
      progress: 0.4,
      scatter: 3,
      edgeColor: '#00ff00',
      color: '#112233',
      roughness: 0.25,
    })
    expect(mat.progress).toBeCloseTo(0.4)
    expect(mat.scatter).toBeCloseTo(3)
    expect(mat.edgeColor.getHexString()).toBe('00ff00')
    // Standard params reached MeshStandardMaterial, not swallowed as erosion keys.
    expect(mat.color.getHexString()).toBe('112233')
    expect(mat.roughness).toBeCloseTo(0.25)
  })

  it('round-trips its accessors', () => {
    const mat = new ErosionMaterial()
    mat.progress = 0.7
    mat.scatter = 5
    mat.edgeStrength = 9
    expect(mat.progress).toBeCloseTo(0.7)
    expect(mat.scatter).toBeCloseTo(5)
    expect(mat.edgeStrength).toBeCloseTo(9)
  })

  it('injects on compile, stashes the shader, and advances the live time uniform', () => {
    const mat = new ErosionMaterial()
    const shader = fakeShader()
    mat.onBeforeCompile(shader)

    expect(mat.userData.shader).toBe(shader)
    expect(shader.vertexShader).toContain(ER_VERTEX_TRANSFORM_SITE)

    const before = shader.uniforms.uTime.value as number
    mat.advance(0.5)
    expect((shader.uniforms.uTime.value as number) - before).toBeCloseTo(0.5)
  })

  it('uses a distinct program cache key from a plain standard material', () => {
    expect(new ErosionMaterial().customProgramCacheKey()).toBe('layerdynamics-erosion-v1')
  })
})
