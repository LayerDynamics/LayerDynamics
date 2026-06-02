import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { Box3, Group, Vector3 } from 'three'
import { Model } from './Ender5Pro'
import { scrubToClipTime } from './scrub'
import { scrollProgress } from '../../../stores/levelScroll'
import { useScene } from '../../../stores/useScene'
import { PRINTER_FIT_WIDTH } from '../../../stores/useLevels'

const GLB_URL = '/assets/objects/Ender5Pro.glb'

/**
 * The 3D Printing level: a rigged Ender 5 Pro whose baked print clips (Bed_Z /
 * GantryY / CarriageX) are scrubbed by the level's scroll progress, so the head
 * rasters and the bed descends as the user scrolls. One AnimationMixer lives here
 * (Ender5Pro/Model is pure geometry); reduced-motion pins a representative pose.
 * GPU resources are owned by drei's GLTF cache; the group disposes cleanly on
 * unmount (dispose={null} keeps the shared cached geometry intact for re-entry).
 */
export default function PrintingLevel() {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const { scene, animations } = useGLTF(GLB_URL)
  const { actions, mixer, names } = useAnimations(animations, group)

  // Frame the FRAME (the aluminium cube), not the whole model: the cantilevered
  // filament spool (plas) skews the full bbox to one side. Measure only the
  // `alu`-material geometry — the frame extrusions/brackets — and scale+centre on
  // that so the cube sits centred and fills the screen width, with the spool
  // intentionally running off the edge. Falls back to the full bbox if no `alu`.
  const { scale, offset } = useMemo(() => {
    scene.updateMatrixWorld(true)
    const frame = new Box3()
    scene.traverse((o) => {
      const mesh = o as { isMesh?: boolean; material?: { name?: string } | { name?: string }[] }
      if (!mesh.isMesh) return
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      if (mat?.name === 'alu') frame.expandByObject(o as Parameters<Box3['expandByObject']>[0])
    })
    const box = frame.isEmpty() ? new Box3().setFromObject(scene) : frame
    const size = new Vector3()
    const center = new Vector3()
    box.getSize(size)
    box.getCenter(center)
    const s = PRINTER_FIT_WIDTH / size.x
    return { scale: s, offset: [-center.x * s, -center.y * s, -center.z * s] as [number, number, number] }
  }, [scene])

  useEffect(() => {
    for (const name of names) {
      const action = actions[name]
      if (!action) continue
      action.play()
      action.paused = true
      if (reducedMotion) action.time = action.getClip().duration * 0.5
    }
    mixer.update(0)
    return () => {
      for (const name of names) actions[name]?.stop()
    }
  }, [actions, names, mixer, reducedMotion])

  useFrame(() => {
    if (reducedMotion) return
    const p = scrollProgress.current ?? 0
    let touched = false
    for (const name of names) {
      const action = actions[name]
      if (!action) continue
      action.time = scrubToClipTime(p, action.getClip().duration)
      touched = true
    }
    if (touched) mixer.update(0)
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
