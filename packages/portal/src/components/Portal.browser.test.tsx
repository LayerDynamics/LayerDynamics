import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { Portal } from './Portal'

afterEach(() => cleanup())

describe('Portal', () => {
  it('smoke-mounts a dormant portal without throwing', async () => {
    const screen = await render(
      <Canvas>
        <ambientLight />
        <Portal app="demo-static" providerOrigin="http://localhost:5179" position={[0, 0, 0]} />
      </Canvas>,
    )
    await expect
      .poll(() => screen.container.querySelector('canvas'), { timeout: 3000 })
      .toBeTruthy()
  })
})
