import { MeshPortalMaterial } from '@react-three/drei'
import type { ReactNode } from 'react'

/** Presents a three.js-native world (the consumer-supplied `children`) inside the
 *  aperture via a GPU stencil portal — no DOM, no provider round-trip. The literal
 *  "window into another world". */
export function StencilPresenter({
  width,
  height,
  children,
  blur = 0,
  resolution = 512,
}: {
  width: number
  height: number
  children: ReactNode
  blur?: number
  resolution?: number
}) {
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <MeshPortalMaterial blur={blur} resolution={resolution}>
        {children}
      </MeshPortalMaterial>
    </mesh>
  )
}
