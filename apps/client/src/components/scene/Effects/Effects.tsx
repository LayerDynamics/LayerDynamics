import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

/**
 * Scene-wide post-processing. Bloom is the load-bearing effect: it turns the
 * brand's emissive violet/cyan accents from flat dim fills into a real glow,
 * which is what gives the layered-glass aesthetic its premium, lit feel.
 * Only sources brighter than `luminanceThreshold` bloom, so the dark glass
 * faces stay crisp while the bright edges/cores light up.
 *
 * Pure presentational config — no logic, so no Container.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={1.15} luminanceThreshold={0.55} luminanceSmoothing={0.18} mipmapBlur radius={0.85} />
      <Vignette eskil={false} offset={0.3} darkness={0.55} />
    </EffectComposer>
  )
}
