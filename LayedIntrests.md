# Interests & Domain Map

A living document of what I build and why — organized by domain, evidenced by repos.

---

## 1. Systems Programming & Native Runtimes

Building close to the metal. Custom runtimes, PTY implementations, capability-based security models, and cross-language FFI bridges.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [forge](https://github.com/LayerDynamics/forge) | Rust + Deno | Electron alternative with capability-based security and system WebViews |
| [node-rust-pty](https://github.com/LayerDynamics/node-rust-pty) | Rust + Node.js | Native PTY with virtual DOM terminal rendering via N-API |
| [blkbox](https://github.com/LayerDynamics/blkbox) | Rust | Sandboxed execution environment |
| [aether](https://github.com/LayerDynamics/aether) | Rust | Low-level runtime experimentation |
| [bb-stream](https://github.com/LayerDynamics/bb-stream) | Go | Streaming infrastructure |

---

## 2. AI/ML on Apple Silicon

Local-first ML inference optimized for M-series chips. Vision, language, audio, multimodal — all running natively without cloud dependencies.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [smlx](https://github.com/LayerDynamics/smlx) | Python + MLX | Sub-1B parameter model framework for M4. Quantization, OpenAI-compatible API, agent system |
| [MLXR](https://github.com/LayerDynamics/MLXR) | C++ | MLX runtime extensions |
| LocalLang (private) | Python + Swift | ML model runner purpose-built for Apple Silicon |

---

## 3. AI Agents & Autonomous Systems

Composable agent architectures, tool-use frameworks, and autonomous workflow orchestration.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [agent-x](https://github.com/LayerDynamics/agent-x) | Python | Agent framework with tool integration |
| [agent_io](https://github.com/LayerDynamics/agent_io) | Python | Agent I/O abstractions |
| [canto](https://github.com/LayerDynamics/canto) | TypeScript | MCP server for Claude Code plugin scaffolding |

---

## 4. 3D Graphics, CAD & Computational Geometry

From point clouds to parametric modeling — working across WebGL, Three.js, React Three Fiber, and native Rust geometry pipelines.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| Plastiq ecosystem (private) | Rust + TS + WASM | Full 3D modeling toolchain: kernel, WASM bridge, web frontend |
| [GameWarden](https://github.com/LayerDynamics/GameWarden) | Rust | ML-first game engine (Bevy ECS + Rapier3D + Gymnasium) |
| [fluxon](https://github.com/LayerDynamics/fluxon) | TypeScript | 3D visualization framework |
| [deno-three](https://github.com/LayerDynamics/deno-three) | TypeScript | Three.js for Deno runtime |

---

## 5. Developer Tooling & CLIs

Tools I build because I need them. CLI frameworks, dependency analyzers, script runners, code generators.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [stega](https://github.com/LayerDynamics/stega) | TypeScript/Deno | Full CLI framework: workflows, i18n, plugins, templates, service management |
| [llm-pack](https://github.com/LayerDynamics/llm-pack) | JavaScript | Package LLM contexts from codebases |
| [mdx-to-json](https://github.com/LayerDynamics/mdx-to-json) | TypeScript | MDX to JSON converter (3 stars) |
| [auto_dep](https://github.com/LayerDynamics/auto_dep) | Python | AST-based dependency extraction |
| [pytui](https://github.com/LayerDynamics/pytui) | Python | Terminal UI for Python script monitoring |
| [scriptic](https://github.com/LayerDynamics/scriptic) | Python | Embeddable Python REPL, zero dependencies |
| [logly](https://github.com/LayerDynamics/logly) | Python | Structured logging utility |
| [jwt-secret-cli](https://github.com/LayerDynamics/jwt-secret-cli) | JavaScript | JWT secret management CLI |

---

## 6. Web Frameworks & Full-Stack

Zero-dependency application frameworks, ORMs with real-time sync, and composable browser toolkits.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [BrowserX](https://github.com/LayerDynamics/BrowserX) | TypeScript/Deno + Rust | Composable browser toolkit: engine, proxy, query, GPU compute, CDP, MCP server |
| [Echelon](https://github.com/LayerDynamics/Echelon) | TypeScript/Deno | "Application OS" — zero-dep web framework with RBAC, KV ORM, telemetry, WASM exec |
| [rex-orm](https://github.com/LayerDynamics/rex-orm) | TypeScript/Deno | ORM with real-time WebSocket sync + GraphQL generation |

---

## 7. Compilers & Language Tooling

Graph-based compilation, query language design, and AST manipulation.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [tgc](https://github.com/LayerDynamics/tgc) | TypeScript + Rust/WASM | TypeGraph Compiler — graph theory for dependency management |
| [nodepad](https://github.com/LayerDynamics/nodepad) | TypeScript | Node-based visual editor |

---

## 8. WebAssembly

Bridging native performance into browser and edge runtimes.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [plastiq-wasm](https://github.com/LayerDynamics/plastiq-wasm) | Rust → WASM | Computational geometry compiled to WASM |
| [plastiq-rust-wasm](https://github.com/LayerDynamics/plastiq-rust-wasm) | Rust → WASM | Rust-native WASM pipeline |
| [create-electron-wasm](https://github.com/LayerDynamics/create-electron-wasm) | JavaScript | Scaffold Electron + WASM projects |

---

## 9. MCP Protocol & Claude Code Ecosystem

Building on Anthropic's Model Context Protocol — servers, plugins, and developer tooling.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [canto](https://github.com/LayerDynamics/canto) | TypeScript | MCP server for Claude Code plugin scaffolding |
| [deno_mcp_starter](https://github.com/LayerDynamics/deno_mcp_starter) | TypeScript/Deno | MCP server starter template |

---

## 10. Hardware, Embedded & DIY

Firmware, 3D printer configs, and edge computing on Raspberry Pi.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| Flipper Zero repos | C | Firmware exploration and guides |
| LDO Milo | Config | 3D printer configuration |
| pi5server | Python | Raspberry Pi 5 edge server |

---

## 11. Web Scraping & Data Pipelines

Crawlers, scrapers, and structured data extraction.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| [HyperCrawler](https://github.com/LayerDynamics/HyperCrawler) | JavaScript | ML-enhanced web crawler |

---

## 12. Security & Compliance

Regulatory tooling and network security.

| Project | Lang | What it demonstrates |
|---------|------|---------------------|
| geopuppet (private) | Python | ITAR/EAR compliance automation |
