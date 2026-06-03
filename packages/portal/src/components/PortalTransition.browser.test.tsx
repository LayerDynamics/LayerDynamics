import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { PortalTransition } from './PortalTransition'

afterEach(() => cleanup())

describe('PortalTransition', () => {
  it('smoke-mounts in warming state without throwing', async () => {
    const screen = await render(
      <Canvas>
        <PortalTransition state="warming" width={2} height={2} />
      </Canvas>,
    )
    await expect.poll(() => screen.container.querySelector('canvas'), { timeout: 3000 }).toBeTruthy()
  })
})
