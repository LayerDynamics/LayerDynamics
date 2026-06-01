// Canonical domains — titles taken verbatim from LayedIntrests.md. Only the
// domains represented by the ~20 public showcase projects are included (the
// "re-bucket the ~20" decision in SPEC-001 §5.4). `Domain` is a union, not an
// enum, to satisfy the package's `erasableSyntaxOnly` TS setting.
import type { Project } from './projects'
import { projects } from './projects'

export type Domain =
  | 'Systems Programming & Native Runtimes'
  | 'AI/ML on Apple Silicon'
  | '3D Graphics, CAD & Computational Geometry'
  | 'Developer Tooling & CLIs'
  | 'Web Frameworks & Full-Stack'
  | 'Compilers & Language Tooling'
  | 'WebAssembly'
  | 'MCP Protocol & Claude Code Ecosystem'
  | 'Web Scraping & Data Pipelines'

/** Canonical display order (LayedIntrests.md ordering, filtered to those present). */
export const domainOrder: Domain[] = [
  'Systems Programming & Native Runtimes',
  'AI/ML on Apple Silicon',
  '3D Graphics, CAD & Computational Geometry',
  'Developer Tooling & CLIs',
  'Web Frameworks & Full-Stack',
  'Compilers & Language Tooling',
  'WebAssembly',
  'MCP Protocol & Claude Code Ecosystem',
  'Web Scraping & Data Pipelines',
]

/** Compact labels for 3D group headers where the full title is too long. */
export const domainShort: Record<Domain, string> = {
  'Systems Programming & Native Runtimes': 'Systems & Runtimes',
  'AI/ML on Apple Silicon': 'AI/ML · Apple Silicon',
  '3D Graphics, CAD & Computational Geometry': '3D & Geometry',
  'Developer Tooling & CLIs': 'Dev Tooling & CLIs',
  'Web Frameworks & Full-Stack': 'Web & Full-Stack',
  'Compilers & Language Tooling': 'Compilers & Lang',
  'WebAssembly': 'WebAssembly',
  'MCP Protocol & Claude Code Ecosystem': 'MCP & Claude Code',
  'Web Scraping & Data Pipelines': 'Scraping & Data',
}

export const projectsByDomain = (domain: Domain): Project[] =>
  projects.filter((p) => p.domain === domain)

/** Domains that actually contain at least one project, in canonical order. */
export const presentDomains = (): Domain[] =>
  domainOrder.filter((d) => projects.some((p) => p.domain === d))
