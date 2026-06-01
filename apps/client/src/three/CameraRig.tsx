import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { MathUtils } from 'three'
import { useScene, type Section } from '../stores/useScene'
import { SCENE } from './layout'

/**
 * Drives the camera down through the scene as the user scrolls (frame-damped,
 * no tween library) and reports the active section to the scene store. Pointer
 * adds a subtle parallax. Honors reduced-motion by snapping instead of damping.
 */
export default function CameraRig() {
  const scroll = useScroll()
  const camera = useThree((s) => s.camera)
  const setSection = useScene((s) => s.setSection)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const contactY = useScene((s) => s.contactY)

  useFrame((state, delta) => {
    const offset = scroll.offset
    const targetY = MathUtils.lerp(SCENE.cameraTopY, contactY, offset)
    const px = state.pointer.x
    const py = state.pointer.y
    const targetX = px * 0.9
    const targetZ = 10

    if (reducedMotion) {
      camera.position.set(targetX, targetY, targetZ)
      camera.rotation.set(0, 0, 0)
    } else {
      camera.position.x = MathUtils.damp(camera.position.x, targetX, 4, delta)
      camera.position.y = MathUtils.damp(camera.position.y, targetY, 6, delta)
      camera.position.z = MathUtils.damp(camera.position.z, targetZ, 4, delta)
      camera.rotation.y = MathUtils.damp(camera.rotation.y, -px * 0.05, 4, delta)
      camera.rotation.x = MathUtils.damp(camera.rotation.x, py * 0.03, 4, delta)
    }

    const section: Section =
      offset < 0.12
        ? 'hero'
        : offset < 0.46
          ? 'process'
          : offset < 0.86
            ? 'collection'
            : 'contact'
    setSection(section)
  })

  return null
}
