import { describe, it, expect, beforeEach } from 'vitest'
import { useLanguageNav } from './useLanguageNav'

const reset = () => useLanguageNav.setState({ pending: null })

describe('useLanguageNav', () => {
  beforeEach(reset)

  it('starts idle (no pending navigation)', () => {
    expect(useLanguageNav.getState().pending).toBeNull()
  })

  it('open(id) records the pending language', () => {
    useLanguageNav.getState().open('rust')
    expect(useLanguageNav.getState().pending).toBe('rust')
  })

  it('consume() clears the pending language', () => {
    useLanguageNav.getState().open('python')
    useLanguageNav.getState().consume()
    expect(useLanguageNav.getState().pending).toBeNull()
  })
})
