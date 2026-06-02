import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { Box3, Group } from 'three'
import { Model } from './Ender5Pro'
import { scrubToClipTime } from './scrub'
import { scrollProgress } from '../../../stores/levelScroll'
import { PRINTER_FIT_WIDTH } from '../../../stores/useLevels'

const GLB_URL = '/assets/objects/Ender5Pro.glb'

/**
 * The 3D Printing level: a rigged Ender 5 Pro driven entirely by scroll, so the
 * whole motion is coupled to the descent. As you scroll the bed lowers from the
 * upmost position (Bed_Z + GantryY scrubbed once over the scroll) and the print
 * head rasters back and forth in lockstep — the CarriageX sweep clip is cycled
 * RASTER_LOOPS times across the scroll for a rapid raster. The head only moves
 * while the bed is descending (i.e. while you scroll) and reverses on reverse-
 * scroll; it parks when idle. One AnimationMixer; Ender5Pro/Model is pure geometry.
 */
const RASTER_LOOPS = 2   // full plays of the 6-sweep clip over the descent (~12 sweeps)
export default function PrintingLevel() {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(GLB_URL)
  const { actions, mixer, names } = useAnimations(animations, group)

  // Centre + size on the FRAME, not the model bbox. The model is asymmetric: the
  // filament spool (and its alu bracket arm) cantilevers off one side, so neither
  // the full bbox NOR the alu bbox is centred on the cube. The gantry beam
  // (`x-axis-strut`) spans the frame post-to-post and is centred on it, so it
  // gives the true horizontal centre + width; the `alu` cube box gives the
  // (un-skewed) vertical/depth centre. Scaling to PRINTER_FIT_WIDTH then makes the
  // frame fill the viewport width with the spool intentionally off the edge.
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
    // Horizontal centre + width: the gantry beam (excludes the spool overhang).
    const aluBox = alu.isEmpty() ? new Box3().setFromObject(scene) : alu
    let cx = (aluBox.min.x + aluBox.max.x) / 2
    let width = aluBox.max.x - aluBox.min.x
    if (!strut.isEmpty()) {
      cx = (strut.min.x + strut.max.x) / 2
      width = strut.max.x - strut.min.x
    }
    // Vertical/depth centre from the FULL printer (gantry + head + base, the spool
    // barely affects height) so the whole thing — and the head at the top — is
    // contained by the camera and stays on screen.
    const full = new Box3().setFromObject(scene)
    const cy = (full.min.y + full.max.y) / 2
    const cz = (full.min.z + full.max.z) / 2
    const s = PRINTER_FIT_WIDTH / width
    return { scale: s, offset: [-cx * s, -cy * s, -cz * s] as [number, number, number] }
  }, [scene])

  useEffect(() => {
    // Every clip is played but PAUSED — we drive each one's `.time` explicitly from
    // scroll and apply with mixer.update(0).
    for (const name of names) {
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
    const bed = actions['Bed_Z']
    const gantry = actions['GantryY']
    const carriage = actions['CarriageX']
    // Bed + gantry: one play over the scroll — the bed descends from the top.
    if (bed) bed.time = scrubToClipTime(p, bed.getClip().duration)
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
  })

  // `group` is the AnimationMixer root (clips target Bed_Z/GantryY/CarriageX by
  // name underneath it). The inner group applies the measured fit transform so
  // the printer is PRINTER_FIT_WIDTH wide and centred at the origin, head-on.
  return (
    <group ref={group} dispose={null}>
      <group scale={scale} position={offset}>
        <Model />
      </group>
    </group>
  )
}

useGLTF.preload(GLB_URL)
