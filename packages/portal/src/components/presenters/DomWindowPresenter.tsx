import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import type { TransportDescriptor } from '../../../shared/contract'
import { projectQuad } from '../lib/projectQuad'

interface Props {
  transport: TransportDescriptor
  providerOrigin: string
  width: number
  height: number
  /** World-matrix source: the portal aperture mesh. */
  meshRef: React.RefObject<THREE.Object3D | null>
  /** True while the portal is engaged ('live'); false suspends interaction. */
  engaged?: boolean
  onVisible?: (visible: boolean) => void
  onError?: () => void
}

/** Renders the guest as a real, interactive iframe layered over the canvas, its
 *  CSS rect synced every frame to the portal's projected screen quad. Because the
 *  provider serves/proxies the guest same-origin, the iframe is both interactive
 *  and untainted — this is what makes a cross-origin app "interactive in place". */
export function DomWindowPresenter({
  transport,
  providerOrigin,
  width,
  height,
  meshRef,
  engaged = true,
  onVisible,
  onError,
}: Props) {
  const { gl, camera, size } = useThree()
  const elRef = useRef<HTMLIFrameElement | null>(null)

  const url = useMemo(
    () => (transport.url ? new URL(transport.url, providerOrigin).toString() : 'about:blank'),
    [transport.url, providerOrigin],
  )

  useEffect(() => {
    const parent = gl.domElement.parentElement
    if (!parent) return
    const iframe = document.createElement('iframe')
    iframe.src = url
    iframe.sandbox.value = (transport.sandbox ?? []).join(' ')
    iframe.style.cssText =
      'position:absolute;top:0;left:0;border:0;transform-origin:top left;background:transparent'
    iframe.addEventListener('error', () => onError?.())
    parent.appendChild(iframe)
    elRef.current = iframe
    return () => {
      iframe.remove()
      elRef.current = null
    }
  }, [url, transport.sandbox, gl, onError])

  useFrame(() => {
    const iframe = elRef.current
    const mesh = meshRef.current
    if (!iframe || !mesh) return
    mesh.updateWorldMatrix(true, false)
    const q = projectQuad({ width, height }, mesh.matrixWorld, camera, size.width, size.height)
    onVisible?.(q.visible)
    iframe.style.pointerEvents = engaged ? 'auto' : 'none'
    if (!q.visible || q.w <= 0 || q.h <= 0) {
      iframe.style.display = 'none'
      return
    }
    iframe.style.display = 'block'
    const dims = transport.dims ?? [Math.round(q.w), Math.round(q.h)]
    iframe.width = String(dims[0])
    iframe.height = String(dims[1])
    const sx = q.w / dims[0]
    const sy = q.h / dims[1]
    iframe.style.transform = `translate(${q.x}px,${q.y}px) scale(${sx},${sy})`
  })

  return null
}
