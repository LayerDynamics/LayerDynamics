import { describe, it, expect } from 'vitest'
import { canTransition, nextOnEvent } from './lifecycle'

describe('portal lifecycle', () => {
  it('allows the forward path dormant→warming→live', () => {
    expect(canTransition('dormant', 'warming')).toBe(true)
    expect(canTransition('warming', 'live')).toBe(true)
  })
  it('allows live↔idle and idle→dormant', () => {
    expect(canTransition('live', 'idle')).toBe(true)
    expect(canTransition('idle', 'live')).toBe(true)
    expect(canTransition('idle', 'dormant')).toBe(true)
  })
  it('forbids skipping (dormant→live) and illegal jumps', () => {
    expect(canTransition('dormant', 'live')).toBe(false)
    expect(canTransition('live', 'warming')).toBe(false)
  })
  it('maps events to the next state', () => {
    expect(nextOnEvent('dormant', 'engage')).toBe('warming')
    expect(nextOnEvent('warming', 'ready')).toBe('live')
    expect(nextOnEvent('live', 'disengage')).toBe('idle')
    expect(nextOnEvent('idle', 'offscreen')).toBe('dormant')
    expect(nextOnEvent('live', 'offscreen')).toBe('idle')
  })
  it('returns the same state for a no-op event', () => {
    expect(nextOnEvent('dormant', 'ready')).toBe('dormant')
  })
})
