import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { TransportDescriptor, ForwardedInput } from '../../../shared/contract'
import { StreamClient } from '../../io/StreamClient'

interface Props {
  transport: TransportDescriptor
  providerOrigin: string
  portalId: string
  width: number
  height: number
  engaged: boolean
}

/** Presents a streamed guest by uploading its frames (ImageBitmap over WS) onto a
 *  texture mapped to the aperture, and forwarding pointer events as normalized
 *  coords back to the producer (FR-9). Used when an app can't be iframed
 *  interactively (cross-origin, no same-origin proxy) but can stream pixels. */
export function TexturePresenter({
  transport,
  providerOrigin,
  portalId,
  width,
  height,
  engaged,
}: Props) {
  const texture = useMemo(() => {
    const t = new THREE.Texture()
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const clientRef = useRef<StreamClient | null>(null)

  useEffect(() => {
    if (!transport.streamEndpoint) return
    const wsUrl = new URL(transport.streamEndpoint, providerOrigin)
      .toString()
      .replace(/^http/, 'ws')
    const client = new StreamClient(wsUrl, portalId)
    clientRef.current = client
    const off = client.onFrame(({ bitmap }) => {
      texture.image = bitmap
      texture.needsUpdate = true
    })
    client.connect()
    return () => {
      off()
      client.dispose()
      clientRef.current = null
    }
  }, [transport.streamEndpoint, providerOrigin, portalId, texture])

  const forward = (kind: ForwardedInput['kind']) => (e: { uv?: THREE.Vector2 }) => {
    if (!engaged || !e.uv) return
    clientRef.current?.sendInput({ kind, x: e.uv.x, y: 1 - e.uv.y })
  }

  return (
    <mesh
      onPointerDown={forward('pointerdown')}
      onPointerMove={forward('pointermove')}
      onPointerUp={forward('pointerup')}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
