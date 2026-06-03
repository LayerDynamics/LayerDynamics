import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import { VisibilityDriver } from './VisibilityDriver'

afterEach(() => cleanup())

describe('VisibilityDriver', () => {
  it('fires onOffscreen when the mesh projects outside the viewport', async () => {
    const onOff = vi.fn()
    function H() {
      const ref = useRef<THREE.Mesh>(null)
      return (
        <Canvas camera={{ position: [0, 0, 5] }}>
          <mesh ref={ref} position={[1000, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial />
          </mesh>
          <VisibilityDriver meshRef={ref} width={1} height={1} onOffscreen={onOff} onOnscreen={() => {}} />
        </Canvas>
      )
    }
    await render(<H />)
    await expect.poll(() => onOff.mock.calls.length, { timeout: 3000 }).toBeGreaterThan(0)
  })

  it('fires onOnscreen for a mesh in view', async () => {
    const onOn = vi.fn()
    function H() {
      const ref = useRef<THREE.Mesh>(null)
      return (
        <Canvas camera={{ position: [0, 0, 5] }}>
          <mesh ref={ref} position={[0, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial />
          </mesh>
          <VisibilityDriver meshRef={ref} width={1} height={1} onOffscreen={() => {}} onOnscreen={onOn} />
        </Canvas>
      )
    }
    await render(<H />)
    await expect.poll(() => onOn.mock.calls.length, { timeout: 3000 }).toBeGreaterThan(0)
  })
})
