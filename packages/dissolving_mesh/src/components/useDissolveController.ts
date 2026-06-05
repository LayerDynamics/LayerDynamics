import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ErosionMaterial } from '../material/ErosionMaterial'

export interface DissolveAnimation {
  /**
   * Controlled dissolve amount, 0..1. When provided, the controller is fully driven by
   * this value and auto-play is ignored — useful for scrubbing or scroll-binding.
   */
  progress?: number
  /** Auto-animate progress 0 -> 1 when `progress` is not provided. Default true. */
  autoPlay?: boolean
  /** Seconds for one full 0 -> 1 pass. Default 3. */
  duration?: number
  /** Restart from 0 after reaching 1 (ignored when pingPong). Default true. */
  loop?: boolean
  /** Reverse at each end instead of restarting (re-forms then dissolves). Default true. */
  pingPong?: boolean
  /** Freeze the animation at the current progress. Default false. */
  paused?: boolean
  /** Called every frame with the current progress (0..1). */
  onProgress?: (progress: number) => void
  /**
   * Called once when the dissolve first reaches progress 1 — for both a non-looping
   * auto-play and a controlled `progress` that is driven to 1 (e.g. scroll/timeline).
   * Re-arms whenever progress could leave 1 (the controls change or it scrubs back down).
   */
  onComplete?: () => void
}

/**
 * Drives one or more {@link ErosionMaterial}s from a single animation clock so a whole
 * multi-mesh GLB dissolves as one coherent object. Either binds the controlled
 * `progress` prop or runs the auto-play (ping-pong by default). Shared by
 * `DissolvingMesh` (one material) and `DissolvingGLTF` (one per GLB mesh).
 */
export function useDissolveController(
  materials: readonly ErosionMaterial[],
  {
    progress,
    autoPlay = true,
    duration = 3,
    loop = true,
    pingPong = true,
    paused = false,
    onProgress,
    onComplete,
  }: DissolveAnimation,
): void {
  const direction = useRef(1)
  const completed = useRef(false)
  const value = useRef(progress ?? 0)

  // Re-arm the one-shot completion latch whenever the animation could run again.
  useEffect(() => {
    completed.current = false
  }, [progress, autoPlay, loop, pingPong, paused])

  useFrame((_, delta) => {
    for (const material of materials) material.advance(delta)

    if (progress !== undefined) {
      value.current = progress
      for (const material of materials) material.progress = progress
      onProgress?.(progress)
      // Fire completion once when a controlled scrub is driven to (or past) 1. The
      // re-arm effect resets the latch when `progress` changes away from this value.
      if (progress >= 1 && !completed.current) {
        completed.current = true
        onComplete?.()
      }
      return
    }

    if (paused || !autoPlay) {
      for (const material of materials) material.progress = value.current
      return
    }

    let next = value.current + (direction.current * delta) / Math.max(duration, 1e-3)

    if (next >= 1) {
      if (pingPong) {
        next = 1
        direction.current = -1
      } else if (loop) {
        next = 0
      } else {
        next = 1
        if (!completed.current) {
          completed.current = true
          onComplete?.()
        }
      }
    } else if (next <= 0) {
      next = 0
      if (pingPong) direction.current = 1
    }

    value.current = next
    for (const material of materials) material.progress = next
    onProgress?.(next)
  })
}
