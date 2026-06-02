import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { useLevels, LEVELS } from '../../../stores/useLevels'

const target = new Vector3()
/** Aspect the legacy (no fit box) framing was tuned for; narrower viewports dolly back. */
const DESIGN_ASPECT = 16 / 9

/**
 * Per-level camera framing — replaces the old continuous CameraRig descent. Each
 * level's content is authored around its own spot; this damps the camera to that
 * level's framing when the active level changes and adds a little pointer parallax.
 *
 * Every level defines a `fitWidth` + `fitHeight` content box, so framing always
 * takes the CONTAIN path: the camera dollies so that box fits whichever dimension
 * is limiting on the current aspect. Wide desktop → height-fit; narrow phone →
 * width-fit, which keeps the subject filling the screen instead of shrinking. The
 * legacy `else` branch (distance-only dolly-back, fixed fov) is a safe fallback
 * for any level without a fit box. Reduced-motion snaps.
 */
export default function LevelCamera() {
  const index = useLevels((s) => s.index)
  const reducedMotion = useLevels((s) => s.reducedMotion)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)

  useFrame((state, delta) => {
    const def = LEVELS[index].camera
    const aspect = size.width / size.height
    const [px, py, pz] = def.position

    let tx: number, ty: number, tz: number, fov: number
    if (def.fitWidth) {
      // Head-on framing. Width-fit distance so the subject fills the viewport
      // width; if fitHeight is given, also a height-fit distance and take the
      // larger (CONTAIN) so the whole subject — and the print head — stays on
      // screen at any aspect. Pure width-fit otherwise ("directly in front").
      fov = def.fov
      const halfV = Math.tan((fov * Math.PI) / 360)
      const FILL = def.fitHeight ? 0.84 : 0.96
      const dW = def.fitWidth / FILL / (2 * aspect * halfV)
      const dH = def.fitHeight ? def.fitHeight / FILL / (2 * halfV) : 0
      tx = px + state.pointer.x * 0.25
      ty = py + state.pointer.y * 0.15
      tz = Math.max(dW, dH)
    } else {
      // Legacy fallback (no fit box): dolly straight back when narrower than the
      // design aspect so the same world-WIDTH stays framed. The fov is held fixed
      // — scaling it too would compound the pull-back into a fisheye that shrinks
      // everything to nothing on portrait.
      const fit = aspect < DESIGN_ASPECT ? DESIGN_ASPECT / Math.max(aspect, 0.4) : 1
      tx = px + state.pointer.x * 0.4
      ty = py + state.pointer.y * 0.2
      tz = pz * fit
      fov = def.fov
    }

    if (reducedMotion) {
      camera.position.set(tx, ty, tz)
    } else {
      camera.position.x = MathUtils.damp(camera.position.x, tx, 4, delta)
      camera.position.y = MathUtils.damp(camera.position.y, ty, 4, delta)
      camera.position.z = MathUtils.damp(camera.position.z, tz, 4, delta)
    }

    target.set(def.target[0], def.target[1], def.target[2])
    camera.lookAt(target)

    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = reducedMotion ? fov : MathUtils.damp(camera.fov, fov, 4, delta)
      camera.updateProjectionMatrix()
    }
  })

  return null
}
