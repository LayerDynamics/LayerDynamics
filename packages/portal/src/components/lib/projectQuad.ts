import * as THREE from 'three'

export interface QuadResult {
  x: number
  y: number
  w: number
  h: number
  visible: boolean
}

const CORNERS = [
  new THREE.Vector3(-0.5, -0.5, 0),
  new THREE.Vector3(0.5, -0.5, 0),
  new THREE.Vector3(0.5, 0.5, 0),
  new THREE.Vector3(-0.5, 0.5, 0),
]

/** Project a w×h plane (given its world matrix) to a screen-space bounding rect.
 *  Returns visible=false when the plane is fully behind the camera or off-screen.
 *  This is what keeps the DOM-window iframe registered to the 3D portal each frame. */
export function projectQuad(
  size: { width: number; height: number },
  world: THREE.Matrix4,
  camera: THREE.Camera,
  vw: number,
  vh: number,
): QuadResult {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let anyInFront = false
  const v = new THREE.Vector3()
  for (const c of CORNERS) {
    v.set(c.x * size.width, c.y * size.height, 0).applyMatrix4(world).project(camera)
    if (v.z < 1) anyInFront = true
    const sx = (v.x * 0.5 + 0.5) * vw
    const sy = (-v.y * 0.5 + 0.5) * vh
    minX = Math.min(minX, sx)
    maxX = Math.max(maxX, sx)
    minY = Math.min(minY, sy)
    maxY = Math.max(maxY, sy)
  }
  const visible = anyInFront && maxX > 0 && minX < vw && maxY > 0 && minY < vh
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, visible }
}
