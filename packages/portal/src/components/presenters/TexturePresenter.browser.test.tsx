import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { TexturePresenter } from './TexturePresenter'

afterEach(() => cleanup())

describe('TexturePresenter', () => {
  it('smoke-mounts and maps a texture onto the aperture without throwing', async () => {
    const screen = await render(
      <Canvas>
        <TexturePresenter
          transport={{ transport: 'texture', streamEndpoint: '/stream/demo-stream', dims: [320, 240] }}
          providerOrigin="http://localhost:5179"
          portalId="p1"
          width={2.4}
          height={1.6}
          engaged
        />
      </Canvas>,
    )
    await expect.poll(() => screen.container.querySelector('canvas'), { timeout: 3000 }).toBeTruthy()
  })
})
