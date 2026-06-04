import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Box3, Color, Group, Mesh, MeshStandardMaterial, Plane, Vector3 } from 'three'
import { BED_TOP_Y, type BedState } from './Printer'
import { brand } from '../../../styles/brand'

const TITLE_URL = '/assets/objects/PrintedName.glb'
// Bed_Z node X/Z (model space) = the build-plate centre — the name sits here.
const BED_X = -0.096
const BED_Z = -0.001
// Bed_Z node-Y → plate top SURFACE (node 0.257 → surface ≈ 0.285).
const PLATE_SURFACE_OFFSET = 0.028
// Height (bed model space) the printed mark is fit to. The bottom-up clip reveal
// completes once the bed descends by this height, so keeping it equal to the
// original Title.glb height preserves the exact same reveal timing for any artwork.
const PRINT_HEIGHT = 0.0555

/**
 * The owner's name/mark "printed" on the build plate (the extruded PrintedName GLB).
 * It sits on the plate and descends WITH it (its Y tracks the bed). A fixed
 * world-space clip plane at the plate's INITIAL (top) surface height hides everything
 * above that line, so at the start it is invisible and reveals BOTTOM-UP as the bed
 * lowers — the print "growing" off the plate. Filament-violet, emissive (blooms like
 * fresh extrusion). Renders inside Printer's scaled/centred group (bed model space).
 *
 * The GLB is normalized/centred at its own origin, so it is fit at load time to
 * PRINT_HEIGHT with its bottom on the plate and centred in X/Z — this makes the
 * reveal behave identically for any artwork swapped in (the source of truth is the
 * fit, not the GLB's intrinsic transform).
 */
export default function PrintedTitle({ bed }: { bed: RefObject<BedState | null> }) {
  const ref = useRef<Group>(null)
  const { scene } = useGLTF(TITLE_URL)

  const { object, clip } = useMemo(() => {
    const clip = new Plane(new Vector3(0, -1, 0), 0) // constant set per-frame (world Y)
    const mat = new MeshStandardMaterial({
      color: new Color(brand.violet),
      emissive: new Color(brand.violet),
      emissiveIntensity: 0.4,
      roughness: 0.45,
      metalness: 0.1,
      clippingPlanes: [clip],
      clipShadows: true,
    })
    const object = scene.clone(true)
    object.traverse((o) => {
      if ((o as Mesh).isMesh) (o as Mesh).material = mat
    })
    // Fit to PRINT_HEIGHT, bottom on the plate (min Y = 0), centred in X/Z. Computed
    // from the cloned object's own bounds so it works for any GLB normalization.
    object.updateMatrixWorld(true)
    const box = new Box3().setFromObject(object)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const s = size.y > 0 ? PRINT_HEIGHT / size.y : 1
    object.scale.setScalar(s)
    object.position.set(-center.x * s, -box.min.y * s, -center.z * s)
    return { object, clip }
  }, [scene])

  useFrame(() => {
    const b = bed.current
    const g = ref.current
    if (!b || !g) return
    // Sit on the plate (bottom of the title at the plate surface) and descend with it.
    g.position.set(BED_X, b.bedNodeY + PLATE_SURFACE_OFFSET, BED_Z)
    // Clip plane fixed at the plate's INITIAL surface, converted to WORLD Y:
    //   worldY(localY) = localY * scale + offsetY  (Printer's inner-group transform)
    const initialSurfaceLocalY = BED_TOP_Y + PLATE_SURFACE_OFFSET
    clip.constant = initialSurfaceLocalY * b.scale + b.offsetY
  })

  return (
    <group ref={ref}>
      <primitive object={object} />
    </group>
  )
}

useGLTF.preload(TITLE_URL)
