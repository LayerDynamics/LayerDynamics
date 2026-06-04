import { describe, it, expect } from 'vitest'
import {
  languages,
  languageOrder,
  languageById,
  reposForLanguage,
  type LanguageId,
} from './languages'
import { langColor } from '../styles/brand'

const ids = languages.map((l) => l.id)

describe('languages data', () => {
  it('has exactly the five language buckets', () => {
    expect(ids).toEqual(['python', 'rust', 'typescript', 'deno', 'webassembly'])
  })

  it('languageOrder is a permutation of the language ids', () => {
    expect([...languageOrder].sort()).toEqual([...ids].sort())
    expect(languageOrder).toHaveLength(ids.length)
  })

  it('every language has a brand color, a glb, a label, a blurb, and ≥1 repo', () => {
    for (const l of languages) {
      expect(langColor[l.id]).toBeTruthy()
      expect(langColor[l.id].base).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(langColor[l.id].accent).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(l.glb).toMatch(/^\/assets\/objects\/\w+Logo\.glb$/)
      expect(l.label.length).toBeGreaterThan(0)
      expect(l.blurb.length).toBeGreaterThan(0)
      expect(l.repos.length).toBeGreaterThan(0)
    }
  })

  it('every repo entry is complete and links to the owner GitHub org', () => {
    for (const l of languages) {
      for (const r of l.repos) {
        expect(r.name.length).toBeGreaterThan(0)
        expect(r.description.length).toBeGreaterThan(0)
        expect(r.primaryLang.length).toBeGreaterThan(0)
        expect(r.stars).toBeGreaterThanOrEqual(0)
        expect(r.url).toBe(`https://github.com/LayerDynamics/${r.name}`)
      }
    }
  })

  it('reposForLanguage matches each bucket and is empty for an unknown id', () => {
    for (const l of languages) {
      expect(reposForLanguage(l.id)).toBe(l.repos)
      expect(reposForLanguage(l.id)).toHaveLength(l.repos.length)
    }
    expect(reposForLanguage('elixir')).toEqual([])
    expect(languageById('elixir')).toBeUndefined()
  })

  it('honors the curated picks exactly (no silent drift)', () => {
    const expected: Record<LanguageId, string[]> = {
      python: ['auto_dep', 'scriptic', 'logly'],
      rust: ['mechx', 'micro_machines', 'pellucid'],
      typescript: ['KiClaude', 'tgc', 'mdx-to-json'],
      deno: ['BrowserX', 'rex-orm'],
      webassembly: ['wasm_os'],
    }
    for (const l of languages) {
      expect(l.repos.map((r) => r.name)).toEqual(expected[l.id])
    }
  })
})
