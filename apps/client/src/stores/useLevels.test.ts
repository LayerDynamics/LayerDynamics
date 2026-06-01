import { describe, it, expect, beforeEach } from 'vitest'
import { useLevels, LEVEL_COUNT } from './useLevels'

const reset = () =>
  useLevels.setState({ index: 0, phase: 'live', direction: null, locked: false, swapped: false })

describe('useLevels reducer', () => {
  beforeEach(reset)

  it('advances forward through a full transition lifecycle', () => {
    const s = useLevels.getState()
    s.requestAdvance()
    expect(useLevels.getState().phase).toBe('transition')
    expect(useLevels.getState().direction).toBe('forward')
    expect(useLevels.getState().locked).toBe(true)
    expect(useLevels.getState().index).toBe(0) // not swapped yet

    useLevels.getState().swap()
    expect(useLevels.getState().index).toBe(1)

    useLevels.getState().endTransition()
    expect(useLevels.getState().phase).toBe('live')
    expect(useLevels.getState().locked).toBe(false)
    expect(useLevels.getState().index).toBe(1)
  })

  it('swap is idempotent within one transition', () => {
    const s = useLevels.getState()
    s.requestAdvance()
    useLevels.getState().swap()
    useLevels.getState().swap()
    expect(useLevels.getState().index).toBe(1)
  })

  it('ignores input while locked', () => {
    useLevels.getState().requestAdvance() // locks
    useLevels.getState().requestAdvance() // ignored
    useLevels.getState().swap()
    expect(useLevels.getState().index).toBe(1)
  })

  it('clamps at the first level (no reverse past 0)', () => {
    useLevels.getState().requestReverse()
    expect(useLevels.getState().phase).toBe('live')
    expect(useLevels.getState().index).toBe(0)
  })

  it('clamps at the last level (no advance past the end)', () => {
    useLevels.setState({ index: LEVEL_COUNT - 1 })
    useLevels.getState().requestAdvance()
    expect(useLevels.getState().phase).toBe('live')
    expect(useLevels.getState().index).toBe(LEVEL_COUNT - 1)
  })

  it('reverses correctly', () => {
    useLevels.setState({ index: 2 })
    useLevels.getState().requestReverse()
    useLevels.getState().swap()
    useLevels.getState().endTransition()
    expect(useLevels.getState().index).toBe(1)
  })
})
