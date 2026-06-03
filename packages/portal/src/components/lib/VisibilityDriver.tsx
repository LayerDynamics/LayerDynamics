import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import { projectQuad } from './projectQuad'

interface Props {
  meshRef: React.RefObject<THREE.Object3D | null>
  width: number
  height: number
  onOffscreen: () => void
  onOnscreen: () => void
}

/** Edge-triggers onOffscreen/onOnscreen as the portal's projected quad enters or
 *  leaves the viewport. Drives the engagement-gated lifecycle so a portal that
 *  scrolls off screen demotes (live→idle→dormant), freeing its guest. */
export function VisibilityDriver({ meshRef, width, height, onOffscreen, onOnscreen }: Props) {
  const { camera, size } = useThree()
  const wasVisible = useRef<boolean | null>(null)
  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.updateWorldMatrix(true, false)
    const q = projectQuad({ width, height }, mesh.matrixWorld, camera, size.width, size.height)
    if (wasVisible.current === q.visible) return
    wasVisible.current = q.visible
    if (q.visible) onOnscreen()
    else onOffscreen()
  })
  return null
}
