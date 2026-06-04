import { describe, it, expect } from 'vitest'
import { portalLayout } from './portalLayout'

describe('portalLayout', () => {
  it('places two cards side-by-side in landscape (aspect >= 1)', () => {
    const l = portalLayout(2, 16 / 9)
    expect(l).toHaveLength(2)
    expect(l[0].position[1]).toBeCloseTo(l[1].position[1]) // same row (equal y)
    expect(l[0].position[0]).toBeLessThan(l[1].position[0]) // distinct columns
    expect(l[0].size[0]).toBeGreaterThan(0)
  })
  it('stacks two cards vertically in portrait (aspect < 1)', () => {
    const l = portalLayout(2, 390 / 844)
    expect(l[0].position[0]).toBeCloseTo(l[1].position[0]) // same column (equal x)
    expect(l[0].position[1]).toBeGreaterThan(l[1].position[1]) // distinct rows
  })
  it('keeps stacked content within the otherWork frame (fitWidth 12.6, fitHeight 9.5)', () => {
    const l = portalLayout(2, 390 / 844)
    for (const c of l) {
      expect(Math.abs(c.position[0]) + c.size[0] / 2).toBeLessThanOrEqual(12.6 / 2)
      expect(Math.abs(c.position[1]) + c.size[1] / 2).toBeLessThanOrEqual(9.5 / 2)
    }
  })
  it('keeps side-by-side content within the otherWork frame in landscape', () => {
    const l = portalLayout(2, 16 / 9)
    for (const c of l) {
      expect(Math.abs(c.position[0]) + c.size[0] / 2).toBeLessThanOrEqual(12.6 / 2)
      expect(Math.abs(c.position[1]) + c.size[1] / 2).toBeLessThanOrEqual(9.5 / 2)
    }
  })
  it('preserves the card aspect ratio (~4:2.6) in landscape', () => {
    for (const c of portalLayout(2, 16 / 9)) {
      expect(c.size[0] / c.size[1]).toBeCloseTo(4 / 2.6, 2)
    }
  })

  it('spans most of the frame width when stacked in portrait (cards scale up)', () => {
    for (const c of portalLayout(2, 390 / 844)) {
      expect(c.size[0]).toBeGreaterThan(12.6 * 0.8) // wide cards, not a narrow column
    }
  })
})
