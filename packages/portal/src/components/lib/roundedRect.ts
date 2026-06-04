import * as THREE from 'three'

/** Trace a (optionally rounded) rectangle centered at the origin onto a
 *  Shape/Path. `hw`/`hh` are half-extents; `r` is the corner radius (clamped to
 *  the shorter half-extent). r ≤ 0 yields square corners. */
export function traceRoundedRect(p: THREE.Shape | THREE.Path, hw: number, hh: number, r: number) {
  const rr = Math.max(0, Math.min(r, hw, hh))
  p.moveTo(-hw + rr, -hh)
  p.lineTo(hw - rr, -hh)
  p.quadraticCurveTo(hw, -hh, hw, -hh + rr)
  p.lineTo(hw, hh - rr)
  p.quadraticCurveTo(hw, hh, hw - rr, hh)
  p.lineTo(-hw + rr, hh)
  p.quadraticCurveTo(-hw, hh, -hw, hh - rr)
  p.lineTo(-hw, -hh + rr)
  p.quadraticCurveTo(-hw, -hh, -hw + rr, -hh)
}

/** A filled, optionally corner-rounded rectangle geometry centered at the origin
 *  — the brand surface the PortalEdge frames (e.g. the dormant card backdrop). */
export function roundedRectGeometry(width: number, height: number, radius = 0) {
  const shape = new THREE.Shape()
  traceRoundedRect(shape, width / 2, height / 2, radius)
  return new THREE.ShapeGeometry(shape)
}
