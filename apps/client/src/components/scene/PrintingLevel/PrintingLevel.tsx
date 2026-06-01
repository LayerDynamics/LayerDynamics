import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { Group } from 'three'
import { Model } from './Ender5Pro'
import { scrubToClipTime } from './scrub'
import { useScene } from '../../../stores/useScene'

interface PrintingLevelProps {
  /** 0..1 progress through the level; drives the print clip playhead. */
  scrollProgress: RefObject<number>
}

const GLB_URL = '/assets/objects/Ender5Pro.glb'

/**
 * The 3D Printing level: a rigged Ender 5 Pro whose baked print clips (Bed_Z /
 * GantryY / CarriageX) are scrubbed by the level's scroll progress, so the head
 * rasters and the bed descends as the user scrolls. One AnimationMixer lives here
 * (Ender5Pro/Model is pure geometry); reduced-motion pins a representative pose.
 * GPU resources are owned by drei's GLTF cache; the group disposes cleanly on
 * unmount (dispose={null} keeps the shared cached geometry intact for re-entry).
 */
export default function PrintingLevel({ scrollProgress }: PrintingLevelProps) {
  const group = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  const { animations } = useGLTF(GLB_URL)
  const { actions, mixer, names } = useAnimations(animations, group)

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

  return (
    <group ref={group} dispose={null}>
      <Model />
    </group>
  )
}

useGLTF.preload(GLB_URL)
