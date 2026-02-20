# Project Showcase

Projects organized by scale and ambition. Everything here is built from scratch — no wrappers, no thin layers over someone else's library.

---

## Tier 1 — Flagship

Framework-scale systems. Cross-language. Deep architecture.

### [BrowserX](https://github.com/LayerDynamics/BrowserX)
**TypeScript/Deno + Rust** · Composable browser toolkit

Not a browser. Not a scraper. A *toolkit* — every piece usable independently or composed together. Browser engine, proxy engine, query engine, GPU compute via wgpu, Chrome DevTools Protocol support, and an MCP server. The kind of project where the architecture diagram has its own architecture diagram.

**Why it matters:** Demonstrates systems-level thinking applied to the web platform. Each engine is a standalone module with clean boundaries, but the real power is in composition.

---

### [forge](https://github.com/LayerDynamics/forge)
**Rust + Deno** · Desktop runtime (Electron alternative)

Capability-based security model. System WebViews instead of bundled Chromium. Cross-platform. Hot reload. Multiple framework templates. Apps don't need to write Rust — the runtime handles the native layer.

**Why it matters:** Takes a real position on what's wrong with Electron (bundle size, memory, security model) and builds a complete alternative with a different philosophy.

---

### [node-rust-pty](https://github.com/LayerDynamics/node-rust-pty)
**Rust + Node.js (N-API)** · Native PTY module

Platform-specific PTY implementations for Linux, macOS, and Windows — all behind a single N-API interface. Virtual DOM-based terminal rendering. This is deep Rust↔JavaScript interop at the systems level.

**Why it matters:** Terminal emulation is one of those problems that looks simple until you're handling platform-specific signal propagation and rendering at 60fps. This solves both sides.

---

### [Echelon](https://github.com/LayerDynamics/Echelon)
**TypeScript/Deno** · Application OS

Zero external dependencies. RBAC authentication, KV-backed ORM, Prometheus telemetry, WASM execution sandbox, job scheduling, plugin system. A web framework that's closer to an operating system for applications.

**Why it matters:** Zero-dep at this scale is a statement — every component is purpose-built, not imported. The scope rivals full-stack frameworks with 200+ dependencies.

---

### [smlx](https://github.com/LayerDynamics/smlx)
**Python + MLX** · Small model framework for Apple Silicon ⭐ 2

Complete framework for sub-1B parameter models on M4. Handles vision, language, audio, and multimodal. Quantization support (GPTQ/AWQ/LoRA/DoRA), OpenAI-compatible API server, built-in agent system.

**Why it matters:** Local-first ML that actually works. Not a demo — a production framework that takes Apple Silicon seriously as an ML platform.

---

## Tier 2 — Strong Demonstrations

Well-scoped, well-executed projects that show range.

### [stega](https://github.com/LayerDynamics/stega) ⭐ 1
**TypeScript/Deno** · CLI framework + workflow automation

Full CLI framework with i18n, plugin architecture, template engine, and service management. Well-documented at 39K repo size. The kind of tool you build because every other CLI framework makes the wrong tradeoffs.

---

### [rex-orm](https://github.com/LayerDynamics/rex-orm) ⭐ 2
**TypeScript/Deno** · Real-time ORM

ORM with real-time WebSocket sync, automatic GraphQL schema generation, and serverless optimization. PostgreSQL + SQLite. Treats the database as a live data source, not a dumb store.

---

### [tgc](https://github.com/LayerDynamics/tgc)
**TypeScript + Rust/WASM** · TypeGraph Compiler

TypeScript compiler/bundler that uses graph theory for dependency management. Cross-platform binaries. Security controls for the build pipeline. A different take on what a compiler's dependency model should look like.

---

### [mdx-to-json](https://github.com/LayerDynamics/mdx-to-json) ⭐ 3
**TypeScript** · MDX converter

Highest-starred original repo. Converts MDX to structured JSON — simple problem, clean solution, published utility that people actually use.

---

### [nodepad](https://github.com/LayerDynamics/nodepad)
**TypeScript** · Node-based visual editor

Visual node editor for composing... anything. Recent, actively developed. The kind of tool that becomes infrastructure for other tools.

---

## Tier 3 — Notable

Smaller scope, still interesting.

| Project | Lang | Description |
|---------|------|-------------|
| [bb-stream](https://github.com/LayerDynamics/bb-stream) ⭐ 1 | Go | Streaming infrastructure |
| [GameWarden](https://github.com/LayerDynamics/GameWarden) | Rust | ML-first game engine (Bevy + Rapier3D + Gymnasium) |
| [canto](https://github.com/LayerDynamics/canto) | TypeScript | MCP server for Claude Code plugin scaffolding |
| [auto_dep](https://github.com/LayerDynamics/auto_dep) | Python | AST-based dependency extraction |
| [pytui](https://github.com/LayerDynamics/pytui) | Python | Terminal UI for script monitoring |
| [scriptic](https://github.com/LayerDynamics/scriptic) | Python | Embeddable REPL, zero deps |
| [HyperCrawler](https://github.com/LayerDynamics/HyperCrawler) | JavaScript | ML-enhanced web crawler |
| [logly](https://github.com/LayerDynamics/logly) | Python | Structured logging |
| [jknife](https://github.com/LayerDynamics/jknife) | Python | JSON manipulation toolkit |
| [create-electron-wasm](https://github.com/LayerDynamics/create-electron-wasm) | JavaScript | Electron + WASM project scaffolding |

---

## What connects all of this

Every project here shares a bias: **build the thing, don't configure someone else's thing.** Zero-dep where possible. Cross-language when the problem demands it. Systems-level thinking applied to every layer of the stack.
