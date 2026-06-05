import { Color, MeshStandardMaterial } from 'three'
import type {
  ColorRepresentation,
  MeshStandardMaterialParameters,
  WebGLProgramParametersWithUniforms,
} from 'three'
import { injectErosion, type ErosionUniforms } from './erosion.glsl'

export interface ErosionMaterialParameters extends MeshStandardMaterialParameters {
  /** Dissolve amount, 0 (intact) .. 1 (fully scattered). */
  progress?: number
  /** World-space distance a flake travels by the time it has fully released. */
  scatter?: number
  /** Frequency of the erosion front sweeping across the mesh (higher = grainier). */
  noiseScale?: number
  /** Width of the transition band each flake passes through (the "edge"). */
  edgeWidth?: number
  /** How much each flake tumbles about its launch axis as it flies. */
  spin?: number
  /** Downward acceleration applied to flying flakes (a gravity arc). */
  gravity?: number
  /** Colour of the glowing burning edge at the dissolve front. */
  edgeColor?: ColorRepresentation
  /** Intensity of the burning-edge emissive glow. */
  edgeStrength?: number
}

const EROSION_KEYS = [
  'progress',
  'scatter',
  'noiseScale',
  'edgeWidth',
  'spin',
  'gravity',
  'edgeColor',
  'edgeStrength',
] as const

/**
 * A `MeshStandardMaterial` that disintegrates its mesh into rigid per-triangle flakes
 * that fly outward and burn at the dissolving edge. PBR lighting from the source GLB
 * material is preserved — the effect is injected into the standard program via
 * `onBeforeCompile`, not a hand-written unlit shader.
 *
 * Pair with {@link prepareErosionGeometry}, which writes the `aScatter` / `aCentroid` /
 * `aSeed` attributes this material reads. {@link DissolvingMesh} wires both together.
 */
export class ErosionMaterial extends MeshStandardMaterial {
  private readonly _erosion: ErosionUniforms

  constructor(params: ErosionMaterialParameters = {}) {
    const std: MeshStandardMaterialParameters = { ...params }
    for (const key of EROSION_KEYS) delete (std as Record<string, unknown>)[key]
    super(std)

    this._erosion = {
      uProgress: { value: params.progress ?? 0 },
      uTime: { value: 0 },
      uScatter: { value: params.scatter ?? 1.5 },
      uNoiseScale: { value: params.noiseScale ?? 1.2 },
      uEdgeWidth: { value: params.edgeWidth ?? 0.15 },
      uSpin: { value: params.spin ?? 2 },
      uGravity: { value: params.gravity ?? 0.6 },
      uEdgeColor: { value: new Color(params.edgeColor ?? '#ff5a1f') },
      uEdgeStrength: { value: params.edgeStrength ?? 2.5 },
    }
  }

  override onBeforeCompile(shader: WebGLProgramParametersWithUniforms): void {
    injectErosion(shader, this._erosion)
    // Stash the compiled shader so tests/tools can confirm the injection took.
    this.userData.shader = shader
  }

  // Force a distinct program from a plain MeshStandardMaterial so three caches it
  // separately and never hands us back an un-injected program.
  override customProgramCacheKey(): string {
    return 'layerdynamics-erosion-v1'
  }

  get progress(): number {
    return this._erosion.uProgress.value
  }
  set progress(value: number) {
    this._erosion.uProgress.value = value
  }

  get scatter(): number {
    return this._erosion.uScatter.value
  }
  set scatter(value: number) {
    this._erosion.uScatter.value = value
  }

  get noiseScale(): number {
    return this._erosion.uNoiseScale.value
  }
  set noiseScale(value: number) {
    this._erosion.uNoiseScale.value = value
  }

  get edgeWidth(): number {
    return this._erosion.uEdgeWidth.value
  }
  set edgeWidth(value: number) {
    this._erosion.uEdgeWidth.value = value
  }

  get spin(): number {
    return this._erosion.uSpin.value
  }
  set spin(value: number) {
    this._erosion.uSpin.value = value
  }

  get gravity(): number {
    return this._erosion.uGravity.value
  }
  set gravity(value: number) {
    this._erosion.uGravity.value = value
  }

  get edgeColor(): Color {
    return this._erosion.uEdgeColor.value as Color
  }

  get edgeStrength(): number {
    return this._erosion.uEdgeStrength.value
  }
  set edgeStrength(value: number) {
    this._erosion.uEdgeStrength.value = value
  }

  /** Advance the internal animation clock (seconds) — drives flake tumbling. */
  advance(deltaSeconds: number): void {
    this._erosion.uTime.value += deltaSeconds
  }
}
