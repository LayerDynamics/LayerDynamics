import { describe, it, expect } from 'vitest'
import { scrubToClipTime } from './scrub'

describe('scrubToClipTime', () => {
  it('maps progress 0..1 to 0..duration', () => {
    expect(scrubToClipTime(0, 10)).toBe(0)
    expect(scrubToClipTime(1, 10)).toBe(10)
    expect(scrubToClipTime(0.5, 10)).toBe(5)
  })

  it('clamps out-of-range progress', () => {
    expect(scrubToClipTime(-0.2, 10)).toBe(0)
    expect(scrubToClipTime(1.7, 10)).toBe(10)
  })

  it('treats non-finite progress as 0', () => {
    expect(scrubToClipTime(NaN, 10)).toBe(0)
  })
})
