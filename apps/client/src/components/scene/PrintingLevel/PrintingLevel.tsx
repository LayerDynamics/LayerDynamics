import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { Box3, Group } from 'three'
import { Model } from './Ender5Pro'
import { scrubToClipTime } from './scrub'
import { scrollProgress } from '../../../stores/levelScroll'
import { useScene } from '../../../stores/useScene'
import { PRINTER_FIT_WIDTH } from '../../../stores/useLevels'

const GLB_URL = '/assets/objects/Ender5Pro.glb'

/**
 * The 3D Printing level: a rigged Ender 5 Pro. Split animation drivers give it a
 * "live print" read — the **bed descends with scroll** (Bed_Z + GantryY scrubbed
 * by scroll progress, starting at the upmost position) while the **print head
 * rasters back and forth continuously on its own** (CarriageX plays a looping,
 * time-driven clip). One AnimationMixer lives here (Ender5Pro/Model is pure
 * geometry). Reduced-motion drops the autonomous raster (head pinned) but keeps
 * the bed responding to scroll, since that's user-initiated, not auto-playing.
 */
const CARRIAGE_SPEED = 1.5   // raster passes faster than the baked 6-per-clip rate
export default function PrintingLevel() {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
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
    const vbox = alu.isEmpty() ? new Box3().setFromObject(scene) : alu
    let cx = (vbox.min.x + vbox.max.x) / 2
    let width = vbox.max.x - vbox.min.x
    if (!strut.isEmpty()) {
      cx = (strut.min.x + strut.max.x) / 2
      width = strut.max.x - strut.min.x
    }
    const cy = (vbox.min.y + vbox.max.y) / 2
    const cz = (vbox.min.z + vbox.max.z) / 2
    const s = PRINTER_FIT_WIDTH / width
    return { scale: s, offset: [-cx * s, -cy * s, -cz * s] as [number, number, number] }
  }, [scene])

  useEffect(() => {
    // Every clip is played but PAUSED — we drive each one's `.time` explicitly and
    // apply with mixer.update(0). (Letting the mixer delta-advance one action while
    // manually setting times on others desyncs them.)
    for (const name of names) {
      const action = actions[name]
      if (!action) continue
      action.play()
      action.paused = true
    }
    const carriage = actions['CarriageX']
    if (carriage && reducedMotion) carriage.time = carriage.getClip().duration * 0.25
    mixer.update(0)
    return () => {
      for (const name of names) actions[name]?.stop()
    }
  }, [actions, names, mixer, reducedMotion])

  useFrame((state) => {
    const p = scrollProgress.current ?? 0
    const bed = actions['Bed_Z']
    const gantry = actions['GantryY']
    const carriage = actions['CarriageX']
    // Bed + gantry follow scroll (bed descends from the top as you scroll).
    if (bed) bed.time = scrubToClipTime(p, bed.getClip().duration)
    if (gantry) gantry.time = scrubToClipTime(p, gantry.getClip().duration)
    // Head rasters continuously on its own — clock-driven, looped via modulo.
    if (carriage && !reducedMotion) {
      const dur = carriage.getClip().duration
      carriage.time = (state.clock.elapsedTime * CARRIAGE_SPEED) % dur
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
