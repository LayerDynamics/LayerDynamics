import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { StencilPresenter } from './StencilPresenter'

afterEach(() => cleanup())

describe('StencilPresenter', () => {
  it('renders a native world through the portal material without throwing', async () => {
    const screen = await render(
      <Canvas>
        <ambientLight />
        <StencilPresenter width={2} height={2}>
          <mesh>
            <boxGeometry />
            <meshStandardMaterial color="hotpink" />
          </mesh>
        </StencilPresenter>
      </Canvas>,
    )
    await expect.poll(() => screen.container.querySelector('canvas'), { timeout: 3000 }).toBeTruthy()
  })
})
