import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import { DomWindowPresenter } from './DomWindowPresenter'

afterEach(() => cleanup())

function Harness() {
  const ref = useRef<THREE.Mesh>(null)
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <mesh ref={ref}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial />
      </mesh>
      <DomWindowPresenter
        transport={{ transport: 'dom-window', url: 'about:blank', sandbox: ['allow-scripts'], dims: [800, 600] }}
        providerOrigin="http://localhost:5179"
        width={2}
        height={2}
        meshRef={ref}
      />
    </Canvas>
  )
}

describe('DomWindowPresenter', () => {
  it('mounts an iframe sibling to the canvas and positions it to the projected quad', async () => {
    const screen = await render(<Harness />)
    // Poll until the frame loop has run and registered the iframe to the quad —
    // a fixed delay races the headless render loop.
    await expect
      .poll(() => screen.container.querySelector('iframe')?.style.transform, { timeout: 3000 })
      .toContain('translate')
  })
})
