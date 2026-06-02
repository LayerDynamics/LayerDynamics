import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

/**
 * Scene-wide post-processing. Bloom is the load-bearing effect: it turns the
 * brand's emissive violet/cyan accents from flat dim fills into a real glow,
 * which is what gives the layered-glass aesthetic its premium, lit feel.
 * Only sources brighter than `bloomThreshold` bloom, so the dark glass faces
 * stay crisp while the bright edges/cores light up.
 *
 * Every visual knob is a prop with the tuned default, so the look can be dialed
 * in by changing a number (the app renders <Effects/> and gets the defaults).
 */
export interface EffectsProps {
  /** Strength of the glow. */
  bloomIntensity?: number
  /** Brightness above which a pixel blooms (lower = more blooms). */
  bloomThreshold?: number
  /** Softness of the bloom threshold knee. */
  bloomSmoothing?: number
  /** Blur kernel radius of the bloom. */
  bloomRadius?: number
  /** Vignette inner radius (where the darkening starts). */
  vignetteOffset?: number
  /** Vignette edge darkness. */
  vignetteDarkness?: number
  /** MSAA sample count for the composer. */
  multisampling?: number
}

export default function Effects({
  bloomIntensity = 1.15,
  bloomThreshold = 0.62,
  bloomSmoothing = 0.18,
  bloomRadius = 0.85,
  vignetteOffset = 0.28,
  vignetteDarkness = 0.7,
  multisampling = 4,
}: EffectsProps) {
  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        mipmapBlur
        radius={bloomRadius}
      />
      <Vignette eskil={false} offset={vignetteOffset} darkness={vignetteDarkness} />
    </EffectComposer>
  )
}
