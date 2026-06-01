import { brand } from '../../../styles/brand'

/**
 * Scene lighting (extracted from the old SceneContent): low ambient + a key from
 * front-top and brand rim lights so the glass slabs catch crisp specular
 * highlights that bloom. Named CameraRigless to signal it carries the lighting
 * the old rig-coupled SceneContent did, minus the camera descent.
 */
export function CameraRigless() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <spotLight
        position={[3, 8, 9]}
        angle={0.5}
        penumbra={0.8}
        intensity={120}
        distance={40}
        color={brand.lavender}
      />
      <pointLight position={[-6, 2, 4]} intensity={45} distance={28} color={brand.cyan} />
      <pointLight position={[6, -1, 5]} intensity={42} distance={28} color={brand.violetSoft} />
      <pointLight position={[0, -12, 7]} intensity={30} distance={40} color={brand.violet} />
    </>
  )
}
