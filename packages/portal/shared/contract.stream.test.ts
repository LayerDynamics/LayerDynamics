import { describe, it, expect } from 'vitest'
import { isStreamFrame, type StreamFrameMeta } from './contract'

describe('stream frame contract', () => {
  it('validates a frame-meta header', () => {
    const meta: StreamFrameMeta = { type: 'frame', portalId: 'p1', w: 800, h: 600, seq: 3 }
    expect(isStreamFrame(meta)).toBe(true)
  })
  it('rejects malformed frame headers', () => {
    expect(isStreamFrame({ type: 'frame' })).toBe(false)
    expect(isStreamFrame({ type: 'other', portalId: 'p', w: 1, h: 1, seq: 0 })).toBe(false)
    expect(isStreamFrame(null)).toBe(false)
  })
})
