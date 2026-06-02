import { brand } from '../../../styles/brand'

/**
 * Scene lighting (extracted from the old SceneContent): low ambient + a key from
 * front-top and brand rim lights so the glass slabs catch crisp specular
 * highlights that bloom. Named CameraRigless to signal it carries the lighting
 * the old rig-coupled SceneContent did, minus the camera descent.
 *
 * Intensities, key angle/penumbra, and the key color are props (tuned defaults),
 * so the lighting can be balanced by changing numbers.
 */
export interface CameraRiglessProps {
  ambientIntensity?: number
  keyIntensity?: number
  keyColor?: string
  keyAngle?: number
  keyPenumbra?: number
  /** Cyan rim (lower-left). */
  rimCyanIntensity?: number
  /** Violet-soft rim (lower-right). */
  rimVioletSoftIntensity?: number
  /** Deep-violet fill (below). */
  rimVioletIntensity?: number
}

export function CameraRigless({
  ambientIntensity = 0.35,
  keyIntensity = 120,
  keyColor = brand.lavender,
  keyAngle = 0.5,
  keyPenumbra = 0.8,
  rimCyanIntensity = 45,
  // Coral rims kept low so they read as an accent edge, not a wash — the white
  // key + white rim do the lighting, the background stays black.
  rimVioletSoftIntensity = 14,
  rimVioletIntensity = 10,
}: CameraRiglessProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <spotLight
        position={[3, 8, 9]}
        angle={keyAngle}
        penumbra={keyPenumbra}
        intensity={keyIntensity}
        distance={40}
        color={keyColor}
      />
      <pointLight position={[-6, 2, 4]} intensity={rimCyanIntensity} distance={28} color={brand.cyan} />
      <pointLight position={[6, -1, 5]} intensity={rimVioletSoftIntensity} distance={28} color={brand.violetSoft} />
      <pointLight position={[0, -12, 7]} intensity={rimVioletIntensity} distance={40} color={brand.violet} />
    </>
  )
}
