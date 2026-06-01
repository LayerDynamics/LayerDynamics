import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { useLevels, LEVELS } from '../../../stores/useLevels'

const target = new Vector3()
/** Aspect the camera framings were tuned for; narrower viewports dolly back. */
const DESIGN_ASPECT = 16 / 9

/**
 * Per-level camera framing — replaces the old continuous CameraRig descent. Each
 * level's content is authored around its own spot; this damps the camera to that
 * level's framing (position/target/fov) when the active level changes, adds a
 * little pointer parallax, and dollies back on portrait/narrow viewports so the
 * subject stays fully framed on any aspect ratio. Reduced-motion snaps.
 */
export default function LevelCamera() {
  const index = useLevels((s) => s.index)
  const reducedMotion = useLevels((s) => s.reducedMotion)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)

  useFrame((state, delta) => {
    const def = LEVELS[index].camera
    const aspect = size.width / size.height
    // Pull back when narrower than the design aspect so nothing clips.
    const fit = aspect < DESIGN_ASPECT ? DESIGN_ASPECT / Math.max(aspect, 0.4) : 1
    const [px, py, pz] = def.position
    const tx = px + state.pointer.x * 0.4
    const ty = py + state.pointer.y * 0.2
    const tz = pz * fit

    if (reducedMotion) {
      camera.position.set(px, py, tz)
    } else {
      camera.position.x = MathUtils.damp(camera.position.x, tx, 4, delta)
      camera.position.y = MathUtils.damp(camera.position.y, ty, 4, delta)
      camera.position.z = MathUtils.damp(camera.position.z, tz, 4, delta)
    }

    target.set(def.target[0], def.target[1], def.target[2])
    camera.lookAt(target)

    const fov = def.fov * fit
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = reducedMotion ? fov : MathUtils.damp(camera.fov, fov, 4, delta)
      camera.updateProjectionMatrix()
    }
  })

  return null
}
