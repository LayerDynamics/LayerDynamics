// Per-language curation for the Languages level (the five extruded logo GLBs).
// Source of truth = the owner's live GitHub (github.com/LayerDynamics), curated by
// hand — NOT data/projects.ts, which is an older, smaller editorial set. Each repo
// entry carries real GitHub metadata (description, stars, primary language) so the
// language page's cards can render and link straight to the repo. `Tier`-style
// unions (not enums) keep the package's `erasableSyntaxOnly` setting happy.

/** Stable url/key slug per language — used in the route /languages/:lang. */
export type LanguageId = 'python' | 'rust' | 'typescript' | 'deno' | 'webassembly'

/** A single curated GitHub repository shown under a language. */
export interface LangRepo {
  /** Exact GitHub repo name (also the display name). */
  name: string
  /** Real one-line description from GitHub (or its README). */
  description: string
  /** Canonical repo URL. */
  url: string
  /** GitHub primary language label, e.g. 'Rust' / 'TypeScript'. */
  primaryLang: string
  /** GitHub stargazer count at curation time. */
  stars: number
}

export interface LanguageDef {
  id: LanguageId
  /** Display name, e.g. 'TypeScript'. */
  label: string
  /** One-line framing shown in the page header. */
  blurb: string
  /** Brand-colored extruded logo GLB (public path). */
  glb: string
  /** Curated, ORDERED repos for this language (multi-tag: a repo may appear under
   *  more than one language). */
  repos: LangRepo[]
}

const GH = 'https://github.com/LayerDynamics'

export const languages: LanguageDef[] = [
  {
    id: 'python',
    label: 'Python',
    blurb: 'Tooling, ML, and developer ergonomics — from AST analysis to Apple-silicon AI.',
    glb: '/assets/objects/PythonLogo.glb',
    repos: [
      {
        name: 'auto_dep',
        description:
          '🐍 AST-based Python dependency extractor that analyzes source code to automatically generate pip and conda dependency files. Supports project-wide scanning, stdlib filtering, and customizable output formats.',
        url: `${GH}/auto_dep`,
        primaryLang: 'Python',
        stars: 0,
      },
      {
        name: 'scriptic',
        description: 'A minimalist, embeddable Python REPL with zero external dependencies.',
        url: `${GH}/scriptic`,
        primaryLang: 'Python',
        stars: 1,
      },
      {
        name: 'logly',
        description: 'a simple logging utility.',
        url: `${GH}/logly`,
        primaryLang: 'Python',
        stars: 1,
      },
    ],
  },
  {
    id: 'rust',
    label: 'Rust',
    blurb: 'Systems work — simulation engines, native runtimes, GPU-native CAD, and deep interop.',
    glb: '/assets/objects/RustLogo.glb',
    repos: [
      {
        name: 'mechx',
        description: 'Next Generation Simulation Engine.',
        url: `${GH}/mechx`,
        primaryLang: 'Rust',
        stars: 0,
      },
      {
        name: 'forge',
        description:
          'Forge is an Electron-like desktop application framework using Rust and Deno. Apps are 100% TypeScript/JavaScript — no per-app Rust required. The runtime provides native system access through a secure, capability-based API.',
        url: `${GH}/forge`,
        primaryLang: 'Rust',
        stars: 3,
      },
      {
        name: 'ferrite',
        description:
          'A PyTorch-like deep learning framework in Rust with automatic differentiation, neural networks, and Metal GPU acceleration for Apple Silicon.',
        url: `${GH}/ferrite`,
        primaryLang: 'Rust',
        stars: 0,
      },
      {
        name: 'Plastiq__',
        description:
          'Plastiq is a GPU-native, open-source parametric CAD engine with a programmable BRep kernel built in Rust and Tauri.',
        url: `${GH}/Plastiq__`,
        primaryLang: 'Rust',
        stars: 0,
      },
      {
        name: 'node-rust-pty',
        description:
          'A high-performance Node.js native module providing comprehensive PTY (pseudo-terminal) functionality with virtual DOM-based rendering and advanced session management, implemented in Rust with N-API bindings.',
        url: `${GH}/node-rust-pty`,
        primaryLang: 'Rust',
        stars: 1,
      },
      {
        name: 'GameWarden',
        description:
          'A ML-first game engine written in Rust. It bridges game development and machine learning research using Bevy ECS and Rapier3D, supports ONNX runtime, Ollama and vLLM, and is Gymnasium-compatible with vectorized environments for ML training, with bindings in both Deno and Node.js.',
        url: `${GH}/GameWarden`,
        primaryLang: 'Rust',
        stars: 0,
      },
    ],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    blurb: 'Compilers, toolkits, and agentic developer tools built end-to-end in TypeScript.',
    glb: '/assets/objects/TypeScriptLogo.glb',
    repos: [
      {
        name: 'KiClaude',
        description:
          "Browser-native, AI-native, KiCad-compatible EDA — Claude Code's hardware counterpart.",
        url: `${GH}/KiClaude`,
        primaryLang: 'TypeScript',
        stars: 0,
      },
      {
        name: 'tgc',
        description:
          'TypeGraph Compiler (TGC) — a high-performance TypeScript compiler and bundler powered by WebAssembly that leverages graph theory for intelligent dependency management. Cross-platform binary generation, granular security controls, and a hybrid TypeScript/Rust architecture.',
        url: `${GH}/tgc`,
        primaryLang: 'TypeScript',
        stars: 1,
      },
      {
        name: 'mdx-to-json',
        description: 'a simple utility to convert and combine mdx to a single json file',
        url: `${GH}/mdx-to-json`,
        primaryLang: 'TypeScript',
        stars: 3,
      },
    ],
  },
  {
    id: 'deno',
    label: 'Deno',
    blurb: 'Deno-native runtimes and data tooling — browser toolkits and type-safe ORMs.',
    glb: '/assets/objects/DenoLogo.glb',
    repos: [
      {
        name: 'BrowserX',
        description:
          'BrowserX is a fully composable, programmable browser toolkit where every component can be used independently or combined to create custom browser experiences.',
        url: `${GH}/BrowserX`,
        primaryLang: 'TypeScript',
        stars: 1,
      },
      {
        name: 'rex-orm',
        description:
          'A modern TypeScript ORM for Deno with PostgreSQL/SQLite support (more coming), real-time sync, GraphQL generation, and seamless serverless deployment. Built for type-safety and developer productivity.',
        url: `${GH}/rex-orm`,
        primaryLang: 'TypeScript',
        stars: 2,
      },
    ],
  },
  {
    id: 'webassembly',
    label: 'WebAssembly',
    blurb: 'Treating the WASM VM as the hardware — an operating system that boots in a browser tab.',
    glb: '/assets/objects/WebAssemblyLogo.glb',
    repos: [
      {
        name: 'wasm_os',
        description:
          'A layered operating system that runs entirely inside a browser tab: a WASM microkernel that schedules WASI processes, a Unix-style userland and terminal, and a windowed desktop compositor.',
        url: `${GH}/wasm_os`,
        primaryLang: 'Rust',
        stars: 0,
      },
    ],
  },
]

/** Left-to-right display order of the logos in the level. */
export const languageOrder: LanguageId[] = [
  'python',
  'rust',
  'typescript',
  'deno',
  'webassembly',
]

export const languageById = (id: string): LanguageDef | undefined =>
  languages.find((l) => l.id === id)

/** Curated repos for a language id (empty array for an unknown id). */
export const reposForLanguage = (id: string): LangRepo[] => languageById(id)?.repos ?? []
