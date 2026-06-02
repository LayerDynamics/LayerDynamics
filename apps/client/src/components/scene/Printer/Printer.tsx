import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { Box3, Group, MathUtils } from 'three'
import { Model } from '../PrintingLevel/Ender5Pro'
import { scrubToClipTime } from '../PrintingLevel/scrub'
import { scrollProgress } from '../../../stores/levelScroll'
import { PRINTER_FIT_WIDTH } from '../../../stores/useLevels'

const GLB_URL = '/assets/objects/Ender5Pro.glb'

const RASTER_LOOPS = 2   // full plays of the 6-sweep clip over the descent (~12 sweeps)
// Bed_Z node local-Y travel (model metres). At the top the bed surface sits just
// under the nozzle (hotend bottom ≈ 0.433; bed surface at node-Y 0.405 reaches it);
// it descends ~0.30 toward the base.
export const BED_TOP_Y = 0.405
export const BED_BOTTOM_Y = 0.105

/** Live readout of the bed every frame, so things printed ON the plate (e.g. the
 *  name) can link their position + clip to it. `scale`/`offsetY` convert the
 *  bed's local model-Y to world-Y (the inner fit group transform). */
export interface BedState {
  p: number
  bedNodeY: number
  scale: number
  offsetY: number
}

/**
 * The Ender 5 printer rig, driven entirely by scroll (motion coupled to the
 * descent): the bed lowers from the upmost position and the head rasters in
 * lockstep. Reusable — the Hero level mounts it with the printed name as a child;
 * children render in the SAME scaled/centred space as the bed, so they can sit on
 * the plate. `onBed` reports the bed state each frame.
 */
export default function Printer({ onBed, children }: { onBed?: (b: BedState) => void; children?: ReactNode }) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(GLB_URL)
  const { actions, mixer, names } = useAnimations(animations, group)

  // Centre + size on the FRAME, not the model bbox. The model is asymmetric: the
  // filament spool (and its alu bracket arm) cantilevers off one side, so neither
  // the full bbox NOR the alu bbox is centred on the cube. The gantry beam
  // (`x-axis-strut`) spans the frame post-to-post and is centred on it, so it
  // gives the true horizontal centre + width; the FULL printer bbox gives the
  // (un-skewed) vertical/depth centre so the head stays framed.
  const { scale, offset } = useMemo(() => {
    scene.updateMatrixWorld(true)
    const expand = (box: Box3, o: object) => box.expandByObject(o as Parameters<Box3['expandByObject']>[0])
    const alu = new Box3()
    const strut = new Box3()
    scene.traverse((o) => {
      const mesh = o as { isMesh?: boolean; name?: string; material?: { name?: string } | { name?: string }[] }
      if (!mesh.isMesh) return
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      if (mat?.name === 'alu') expand(alu, o)
      if (mesh.name === 'x-axis-strut') expand(strut, o)
    })
    const aluBox = alu.isEmpty() ? new Box3().setFromObject(scene) : alu
    let cx = (aluBox.min.x + aluBox.max.x) / 2
    let width = aluBox.max.x - aluBox.min.x
    if (!strut.isEmpty()) {
      cx = (strut.min.x + strut.max.x) / 2
      width = strut.max.x - strut.min.x
    }
    const full = new Box3().setFromObject(scene)
    const cy = (full.min.y + full.max.y) / 2
    const cz = (full.min.z + full.max.z) / 2
    const s = PRINTER_FIT_WIDTH / width
    return { scale: s, offset: [-cx * s, -cy * s, -cz * s] as [number, number, number] }
  }, [scene])

  useEffect(() => {
    // Play GantryY + CarriageX (paused — we scrub their `.time`). Bed_Z is NOT
    // played: its baked clip only nudges the plate within mid-frame, so we drive
    // the bed's height directly (see useFrame) for a full top→bottom travel.
    for (const name of ['GantryY', 'CarriageX']) {
      const action = actions[name]
      if (!action) continue
      action.play()
      action.paused = true
    }
    mixer.update(0)
    return () => {
      for (const name of names) actions[name]?.stop()
    }
  }, [actions, names, mixer])

  useFrame(() => {
    const p = scrollProgress.current ?? 0
    const gantry = actions['GantryY']
    const carriage = actions['CarriageX']
    if (gantry) gantry.time = scrubToClipTime(p, gantry.getClip().duration)
    // Head sweep COUPLED to the descent: cycle the 6-sweep clip RASTER_LOOPS times
    // across the scroll, so it rasters rapidly as the bed lowers, only while
    // scrolling, and reverses on reverse-scroll. (Clip starts/ends centred, so the
    // modulo wrap is seamless.)
    if (carriage) {
      const dur = carriage.getClip().duration
      carriage.time = (p * dur * RASTER_LOOPS) % dur
    }
    mixer.update(0)
    // Build plate: starts at the TOP (just under the nozzle) at p=0 and descends
    // the full travel as you scroll. Driven directly (the mixer doesn't touch it).
    const bedNodeY = MathUtils.lerp(BED_TOP_Y, BED_BOTTOM_Y, p)
    const bedNode = group.current?.getObjectByName('Bed_Z')
    if (bedNode) bedNode.position.y = bedNodeY
    onBed?.({ p, bedNodeY, scale, offsetY: offset[1] })
  })

  // `group` is the AnimationMixer root. The inner group applies the measured fit
  // transform so the printer is PRINTER_FIT_WIDTH wide and centred, head-on; the
  // printed `children` live in this same space so they sit on the plate.
  return (
    <group ref={group} dispose={null}>
      <group scale={scale} position={offset}>
        <Model />
        {children}
      </group>
    </group>
  )
}

useGLTF.preload(GLB_URL)
