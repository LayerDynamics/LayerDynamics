import { useCameraRig } from './useCameraRig'

/**
 * Drives the scroll camera. All behavior lives in the useCameraRig hook; this
 * component just mounts it inside the Canvas tree and renders nothing.
 */
export default function CameraRig() {
  useCameraRig()
  return null
}
