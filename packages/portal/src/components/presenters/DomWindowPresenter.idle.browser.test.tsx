import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import { DomWindowPresenter } from './DomWindowPresenter'

afterEach(() => cleanup())

function Harness({ engaged }: { engaged: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <mesh ref={ref}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial />
      </mesh>
      <DomWindowPresenter
        transport={{ transport: 'dom-window', url: 'about:blank', sandbox: [], dims: [400, 300] }}
        providerOrigin="http://localhost:5179"
        width={2}
        height={2}
        meshRef={ref}
        engaged={engaged}
      />
    </Canvas>
  )
}

describe('DomWindowPresenter idle freeze', () => {
  it('disables pointer events when not engaged (guest suspended provider-side)', async () => {
    const screen = await render(<Harness engaged={false} />)
    await expect
      .poll(() => screen.container.querySelector('iframe')?.style.pointerEvents, { timeout: 3000 })
      .toBe('none')
  })

  it('enables pointer events when engaged (interactive in place)', async () => {
    const screen = await render(<Harness engaged={true} />)
    await expect
      .poll(() => screen.container.querySelector('iframe')?.style.pointerEvents, { timeout: 3000 })
      .toBe('auto')
  })
})
