import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Color, Group, Mesh, MeshStandardMaterial, Plane, Vector3 } from 'three'
import { BED_TOP_Y, type BedState } from './Printer'
import { brand } from '../../../styles/brand'

const TITLE_URL = '/assets/objects/Title.glb'
// Bed_Z node X/Z (model space) = the build-plate centre — the name sits here.
const BED_X = -0.096
const BED_Z = -0.001
// Bed_Z node-Y → plate top SURFACE (node 0.257 → surface ≈ 0.285).
const PLATE_SURFACE_OFFSET = 0.028

/**
 * The owner's name "printed" on the build plate. The Title sits on the plate and
 * descends WITH it (its Y tracks the bed). A fixed world-space clip plane at the
 * plate's INITIAL (top) surface height hides everything above that line, so at the
 * start the name is invisible and it reveals BOTTOM-UP as the bed lowers — the
 * print "growing" off the plate. Filament-violet, emissive (blooms like fresh
 * extrusion). Renders inside Printer's scaled/centred group (bed model space).
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
