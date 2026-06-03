import { describe, it, expect } from 'vitest'
import { selectPresenter } from './selectPresenter'

describe('selectPresenter', () => {
  it('uses the negotiated transport when healthy', () => {
    expect(selectPresenter({ transport: 'dom-window', url: '/x/' }, { domWindowFailed: false })).toBe('dom-window')
    expect(selectPresenter({ transport: 'texture', streamEndpoint: '/s' }, {})).toBe('texture')
    expect(selectPresenter({ transport: 'stencil', native: true }, {})).toBe('stencil')
  })
  it('falls through dom-window→texture→poster on failure', () => {
    expect(selectPresenter({ transport: 'dom-window', url: '/x/', streamEndpoint: '/s' }, { domWindowFailed: true })).toBe('texture')
    expect(selectPresenter({ transport: 'dom-window', url: '/x/' }, { domWindowFailed: true })).toBe('poster')
  })
  it('returns poster for an incomplete descriptor', () => {
    expect(selectPresenter({ transport: 'texture' }, {})).toBe('poster')
    expect(selectPresenter({ transport: 'stencil' }, {})).toBe('poster')
  })
})
