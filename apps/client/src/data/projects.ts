// Project data — source of truth is LayeredShowcase.md (tiers) cross-referenced
// with LayedIntrests.md (canonical domains, see SPEC-001 §5.4). Tier is a union,
// not an enum, to satisfy the package's `erasableSyntaxOnly` TS setting.
import type { Domain } from './domains'

export type Tier = 'flagship' | 'strong' | 'notable'

export interface Project {
  id: string
  name: string
  tier: Tier
  langs: string[]
  tagline: string
  blurb: string
  why?: string
  url: string
  domain: Domain
  stars?: number
}

export const projects: Project[] = [
  // ── Tier 1 — Flagship ──────────────────────────────────────────────────
  {
    id: 'browserx',
    name: 'BrowserX',
    tier: 'flagship',
    langs: ['TypeScript/Deno', 'Rust'],
    tagline: 'Composable browser toolkit',
    blurb:
      'Not a browser. Not a scraper. A toolkit — every piece usable independently or composed together. Browser engine, proxy engine, query engine, GPU compute via wgpu, Chrome DevTools Protocol support, and an MCP server. The kind of project where the architecture diagram has its own architecture diagram.',
    why:
      'Demonstrates systems-level thinking applied to the web platform. Each engine is a standalone module with clean boundaries, but the real power is in composition.',
    url: 'https://github.com/LayerDynamics/BrowserX',
    domain: 'Web Frameworks & Full-Stack',
  },
  {
    id: 'forge',
    name: 'forge',
    tier: 'flagship',
    langs: ['Rust', 'Deno'],
    tagline: 'Desktop runtime (Electron alternative)',
    blurb:
      'Capability-based security model. System WebViews instead of bundled Chromium. Cross-platform. Hot reload. Multiple framework templates. Apps don’t need to write Rust — the runtime handles the native layer.',
    why:
      'Takes a real position on what’s wrong with Electron (bundle size, memory, security model) and builds a complete alternative with a different philosophy.',
    url: 'https://github.com/LayerDynamics/forge',
    domain: 'Systems Programming & Native Runtimes',
    stars: 3,
  },
  {
    id: 'node-rust-pty',
    name: 'node-rust-pty',
    tier: 'flagship',
    langs: ['Rust', 'Node.js (N-API)'],
    tagline: 'Native PTY module',
    blurb:
      'Platform-specific PTY implementations for Linux, macOS, and Windows — all behind a single N-API interface. Virtual DOM-based terminal rendering. This is deep Rust↔JavaScript interop at the systems level.',
    why:
      'Terminal emulation looks simple until you’re handling platform-specific signal propagation and rendering at 60fps. This solves both sides.',
    url: 'https://github.com/LayerDynamics/node-rust-pty',
    domain: 'Systems Programming & Native Runtimes',
  },
  {
    id: 'echelon',
    name: 'Echelon',
    tier: 'flagship',
    langs: ['TypeScript/Deno'],
    tagline: 'Application OS',
    blurb:
      'Zero external dependencies. RBAC authentication, KV-backed ORM, Prometheus telemetry, WASM execution sandbox, job scheduling, plugin system. A web framework that’s closer to an operating system for applications.',
    why:
      'Zero-dep at this scale is a statement — every component is purpose-built, not imported. The scope rivals full-stack frameworks with 200+ dependencies.',
    url: 'https://github.com/LayerDynamics/Echelon',
    domain: 'Web Frameworks & Full-Stack',
  },
  {
    id: 'smlx',
    name: 'smlx',
    tier: 'flagship',
    langs: ['Python', 'MLX'],
    tagline: 'Small model framework for Apple Silicon',
    blurb:
      'Complete framework for sub-1B parameter models on M4. Handles vision, language, audio, and multimodal. Quantization support (GPTQ/AWQ/LoRA/DoRA), OpenAI-compatible API server, built-in agent system.',
    why:
      'Local-first ML that actually works. Not a demo — a production framework that takes Apple Silicon seriously as an ML platform.',
    url: 'https://github.com/LayerDynamics/smlx',
    domain: 'AI/ML on Apple Silicon',
    stars: 3,
  },
  {
    id: 'kiclaude',
    name: 'KiClaude',
    tier: 'flagship',
    langs: ['TypeScript'],
    tagline: 'AI-native, KiCad-compatible EDA',
    blurb:
      'Browser-native, AI-native, KiCad-compatible electronic design automation — the hardware-design counterpart to Claude Code. Schematic and PCB work that runs in the browser and is built for AI-assisted workflows, interoperating with the KiCad ecosystem instead of replacing it.',
    why:
      'Brings the AI-native, browser-first approach to EDA — a domain that has historically been desktop-bound and proprietary. Pairs hardware design with an agentic workflow the way Claude Code pairs with software.',
    url: 'https://github.com/LayerDynamics/KiClaude',
    domain: '3D Graphics, CAD & Computational Geometry',
  },
  {
    id: 'lore',
    name: 'Lore',
    tier: 'flagship',
    langs: ['TypeScript'],
    tagline: 'Claude Code plugin framework',
    blurb:
      'An opinionated Claude Code plugin framework that bundles structured workflow skills, slash commands, specialized subagents, and session hooks into a single installable plugin — turning ad-hoc AI assistance into deterministic, repeatable development workflows.',
    why:
      'Treats AI-assisted development as an engineerable system: composable skills, agents, and hooks with real structure, not one-off prompts. The framework this very portfolio is built with.',
    url: 'https://github.com/LayerDynamics/Lore',
    domain: 'MCP Protocol & Claude Code Ecosystem',
  },

  // ── Tier 2 — Strong Demonstrations ─────────────────────────────────────
  {
    id: 'stega',
    name: 'stega',
    tier: 'strong',
    langs: ['TypeScript/Deno'],
    tagline: 'CLI framework + workflow automation',
    blurb:
      'Full CLI framework with i18n, plugin architecture, template engine, and service management. Well-documented at 39K repo size. The kind of tool you build because every other CLI framework makes the wrong tradeoffs.',
    url: 'https://github.com/LayerDynamics/stega',
    domain: 'Developer Tooling & CLIs',
    stars: 1,
  },
  {
    id: 'rex-orm',
    name: 'rex-orm',
    tier: 'strong',
    langs: ['TypeScript/Deno'],
    tagline: 'Real-time ORM',
    blurb:
      'ORM with real-time WebSocket sync, automatic GraphQL schema generation, and serverless optimization. PostgreSQL + SQLite. Treats the database as a live data source, not a dumb store.',
    url: 'https://github.com/LayerDynamics/rex-orm',
    domain: 'Web Frameworks & Full-Stack',
    stars: 2,
  },
  {
    id: 'tgc',
    name: 'tgc',
    tier: 'strong',
    langs: ['TypeScript', 'Rust/WASM'],
    tagline: 'TypeGraph Compiler',
    blurb:
      'TypeScript compiler/bundler that uses graph theory for dependency management. Cross-platform binaries. Security controls for the build pipeline. A different take on what a compiler’s dependency model should look like.',
    url: 'https://github.com/LayerDynamics/tgc',
    domain: 'Compilers & Language Tooling',
  },
  {
    id: 'mdx-to-json',
    name: 'mdx-to-json',
    tier: 'strong',
    langs: ['TypeScript'],
    tagline: 'MDX converter',
    blurb:
      'Highest-starred original repo. Converts MDX to structured JSON — simple problem, clean solution, published utility that people actually use.',
    url: 'https://github.com/LayerDynamics/mdx-to-json',
    domain: 'Developer Tooling & CLIs',
    stars: 3,
  },
  {
    id: 'nodepad',
    name: 'nodepad',
    tier: 'strong',
    langs: ['TypeScript'],
    tagline: 'Node-based visual editor',
    blurb:
      'Visual node editor for composing… anything. Recent, actively developed. The kind of tool that becomes infrastructure for other tools.',
    url: 'https://github.com/LayerDynamics/nodepad',
    domain: 'Compilers & Language Tooling',
  },

  // ── Tier 3 — Notable ───────────────────────────────────────────────────
  {
    id: 'bb-stream',
    name: 'bb-stream',
    tier: 'notable',
    langs: ['Go'],
    tagline: 'Streaming infrastructure',
    blurb: 'Streaming infrastructure built in Go.',
    url: 'https://github.com/LayerDynamics/bb-stream',
    domain: 'Systems Programming & Native Runtimes',
    stars: 1,
  },
  {
    id: 'gamewarden',
    name: 'GameWarden',
    tier: 'notable',
    langs: ['Rust'],
    tagline: 'ML-first game engine',
    blurb:
      'ML-first game engine built on Bevy ECS, Rapier3D physics, and a Gymnasium-compatible training interface.',
    url: 'https://github.com/LayerDynamics/GameWarden',
    domain: '3D Graphics, CAD & Computational Geometry',
  },
  {
    id: 'canto',
    name: 'canto',
    tier: 'notable',
    langs: ['TypeScript'],
    tagline: 'MCP server for Claude Code plugin scaffolding',
    blurb:
      'MCP server that scaffolds Claude Code plugins — commands, agents, hooks, and skills — from a single integration point.',
    url: 'https://github.com/LayerDynamics/canto',
    domain: 'MCP Protocol & Claude Code Ecosystem',
  },
  {
    id: 'auto_dep',
    name: 'auto_dep',
    tier: 'notable',
    langs: ['Python'],
    tagline: 'AST-based dependency extraction',
    blurb:
      'Extracts a project’s real dependency graph by parsing the AST rather than trusting manifests.',
    url: 'https://github.com/LayerDynamics/auto_dep',
    domain: 'Developer Tooling & CLIs',
  },
  {
    id: 'pytui',
    name: 'pytui',
    tier: 'notable',
    langs: ['Python'],
    tagline: 'Terminal UI for script monitoring',
    blurb: 'Terminal UI for monitoring long-running scripts in real time.',
    url: 'https://github.com/LayerDynamics/pytui',
    domain: 'Developer Tooling & CLIs',
  },
  {
    id: 'scriptic',
    name: 'scriptic',
    tier: 'notable',
    langs: ['Python'],
    tagline: 'Embeddable REPL, zero deps',
    blurb:
      'An embeddable REPL with zero dependencies — drop a real interactive shell into any Python program.',
    url: 'https://github.com/LayerDynamics/scriptic',
    domain: 'Developer Tooling & CLIs',
  },
  {
    id: 'hypercrawler',
    name: 'HyperCrawler',
    tier: 'notable',
    langs: ['JavaScript'],
    tagline: 'ML-enhanced web crawler',
    blurb: 'A web crawler that uses ML to prioritize and classify what it fetches.',
    url: 'https://github.com/LayerDynamics/HyperCrawler',
    domain: 'Web Scraping & Data Pipelines',
  },
  {
    id: 'logly',
    name: 'logly',
    tier: 'notable',
    langs: ['Python'],
    tagline: 'Structured logging',
    blurb: 'Structured logging for Python with sane defaults.',
    url: 'https://github.com/LayerDynamics/logly',
    domain: 'Developer Tooling & CLIs',
  },
  {
    id: 'jknife',
    name: 'jknife',
    tier: 'notable',
    langs: ['Python'],
    tagline: 'Jackknife estimation utilities',
    blurb:
      'Framework-agnostic jackknife estimation utilities for statistical models — resampling-based bias and variance estimation that drops into any modeling workflow.',
    url: 'https://github.com/LayerDynamics/jknife',
    domain: 'Developer Tooling & CLIs',
  },
  {
    id: 'create-electron-wasm',
    name: 'create-electron-wasm',
    tier: 'notable',
    langs: ['JavaScript'],
    tagline: 'Electron + WASM project scaffolding',
    blurb: 'Project scaffolding for Electron apps that ship WebAssembly modules.',
    url: 'https://github.com/LayerDynamics/create-electron-wasm',
    domain: 'WebAssembly',
  },

  // ── 3D / graphics / CAD tooling ────────────────────────────────────────
  {
    id: 'steploader',
    name: 'STEPLoader',
    tier: 'notable',
    langs: ['TypeScript'],
    tagline: 'STEP CAD loader for react-three-fiber',
    blurb:
      'A parser and loader that brings STEP CAD files into react-three-fiber scenes — bridging mechanical CAD geometry and the web 3D stack so engineering models render natively in R3F.',
    url: 'https://github.com/LayerDynamics/STEPLoader',
    domain: '3D Graphics, CAD & Computational Geometry',
  },
  {
    id: 'kmp-three-suite',
    name: 'kmp-three-suite',
    tier: 'notable',
    langs: ['JavaScript'],
    tagline: 'KeyShot materials → Three.js',
    blurb:
      'Parses Luxion KeyShot KMP/MTL material packages into Three.js MaterialDefinitions — an isomorphic ESM bridge from a proprietary rendering format into the open web 3D pipeline.',
    url: 'https://github.com/LayerDynamics/kmp-three-suite',
    domain: '3D Graphics, CAD & Computational Geometry',
  },
  {
    id: 'three-material-regress-harness',
    name: 'three-material-regress-harness',
    tier: 'notable',
    langs: ['JavaScript'],
    tagline: 'R3F material regression harness',
    blurb:
      'Reads the R3F canvas framebuffer via gl.readPixels and scores it against a reference image on four silhouette-masked metrics (RMSE, Rec.709 SSIM, pixelmatch %, max channel Δ) — a CI regression gate for calibrating material parameters toward a target render.',
    url: 'https://github.com/LayerDynamics/three-material-regress-harness',
    domain: '3D Graphics, CAD & Computational Geometry',
  },
  {
    id: 'r3f-splashscreen',
    name: 'r3f-splashscreen',
    tier: 'notable',
    langs: ['TypeScript'],
    tagline: 'Shader-driven R3F splash screen',
    blurb:
      'A drop-in animated splash screen for React apps: a shader-driven, customizable blob rendered with Three.js and react-three-fiber, with a text overlay.',
    url: 'https://github.com/LayerDynamics/r3f-splashscreen',
    domain: '3D Graphics, CAD & Computational Geometry',
  },
]

export const tiers: Tier[] = ['flagship', 'strong', 'notable']

// Displayed tier headers (the internal Tier keys stay flagship/strong/notable).
export const tierTitle: Record<Tier, string> = {
  flagship: 'Featured',
  strong: 'Selected',
  notable: 'More Work',
}

export const projectsByTier = (tier: Tier): Project[] =>
  projects.filter((p) => p.tier === tier)

export const projectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id)
