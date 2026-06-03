import { describe, it, expect } from 'vitest'
import { pickDemotions } from './liveCap'

describe('MAX_LIVE', () => {
  it('demotes the least-recently-engaged live portals beyond the cap', () => {
    const live = [
      { id: 'a', lastEngagedAt: 30 },
      { id: 'b', lastEngagedAt: 10 },
      { id: 'c', lastEngagedAt: 20 },
    ]
    expect(pickDemotions(live, 1)).toEqual(['c', 'b']) // keep newest (a)
  })
  it('returns nothing under the cap', () => {
    expect(pickDemotions([{ id: 'a', lastEngagedAt: 1 }], 1)).toEqual([])
  })
  it('respects a higher cap', () => {
    const live = [
      { id: 'a', lastEngagedAt: 3 },
      { id: 'b', lastEngagedAt: 2 },
      { id: 'c', lastEngagedAt: 1 },
    ]
    expect(pickDemotions(live, 2)).toEqual(['c'])
  })
})
