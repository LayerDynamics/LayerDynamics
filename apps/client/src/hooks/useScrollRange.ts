import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

/**
 * Per-section scroll progress. Given a section's start offset and length within
 * the ScrollControls range (both 0..1 of total scroll), returns a ref whose
 * `.current` is updated every frame to that section's local progress, clamped to
 * 0..1. Mirrors the `data.range(start, length)` idiom from the mohitvirli
 * reference, but exposed as a ref so consumers can read it inside their own
 * useFrame without re-rendering.
 */
export function useScrollRange(start: number, length: number) {
  const data = useScroll()
  const progress = useRef(0)
  useFrame(() => {
    progress.current = data.range(start, length)
  })
  return progress
}
