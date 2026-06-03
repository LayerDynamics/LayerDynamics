import { describe, it, expect } from 'vitest'
import { StreamClient } from './StreamClient'

async function realImageBlob(): Promise<Blob> {
  const canvas = new OffscreenCanvas(2, 2)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'red'
  ctx.fillRect(0, 0, 2, 2)
  return canvas.convertToBlob()
}

describe('StreamClient', () => {
  it('pairs a JSON frame-meta with the following blob and emits a decoded frame', async () => {
    const client = new StreamClient('ws://localhost:5179/stream/demo-stream', 'p1')
    const frames: { meta: { seq: number } }[] = []
    client.onFrame((f) => frames.push(f))
    await client.handleMessage(JSON.stringify({ type: 'frame', portalId: 'p1', w: 2, h: 2, seq: 9 }))
    await client.handleMessage(await realImageBlob())
    expect(frames.length).toBe(1)
    expect(frames[0].meta.seq).toBe(9)
  })

  it('ignores a blob with no preceding frame header', async () => {
    const client = new StreamClient('ws://localhost:5179/stream/demo-stream', 'p1')
    const frames: unknown[] = []
    client.onFrame((f) => frames.push(f))
    await client.handleMessage(await realImageBlob())
    expect(frames.length).toBe(0)
  })
})
