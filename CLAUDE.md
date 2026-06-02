# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is the `LayerDynamics/LayerDynamics` **GitHub profile repository** (Ryan O'Boyle / "Layer Dynamics") in the middle of a migration. It currently serves two purposes at once:

1. **The published profile** — what renders on the GitHub profile page. This is the only part committed to `main`: `README.md`, the showcase docs (`LayeredShowcase.md`, `LayedIntrests.md`), generated SVGs under `assets/`, and the two GitHub Actions workflows that regenerate them.
2. **An in-progress 3D portfolio monorepo** — a pnpm + Cargo workspace being scaffolded to replace/augment the static profile with an interactive WebGL site. **Almost all of this is untracked and unfinished** (see "Current state" below).

When reasoning about a change, first decide which of these two you are touching — they have nothing to do with each other mechanically.

## Current state (read before assuming anything exists)

The monorepo is scaffolding, not a working system yet. Do not assume a package is implemented because its directory exists.

- **Untracked**: `apps/`, `packages/`, `crates/`, `Cargo.toml`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `node_modules/`, `.gitignore` are all untracked working-tree files. Only the profile content is in git history.
- **`apps/client`** — the one real, runnable package. It is currently the **default Vite + React template** (a counter and "Get started" links), not yet portfolio code. `src/components/Layout.tsx` is an empty file; `src/constants`, `src/stores`, `src/hooks` are empty dirs.
- **`packages/*`** (`csg`, `stylekit`, `particles`, `raycast`, `shaders`, `physics`, `pathtracer`, `portal`) — each now has a **minimal private manifest** (`@layerdynamics/<name>`, added so pnpm can resolve the workspace) but an empty/near-empty `src/`. None are implemented. They are the intended home for reusable R3F pieces extracted from `apps/client` later — do not pre-fill them.
- **`crates/*`** (`layerdynamics-wasm`, `physics-wasm`) — empty `src/` and empty/absent `Cargo.toml`. The root `Cargo.toml` is also empty — the Rust workspace is not defined yet.
- **`services/`, `tools/`, `data/`, `docs/`** — empty directories.

If a task requires one of these stubs, you are likely **creating** it from scratch, not editing existing logic. Initialize the empty `package.json`/`Cargo.toml` files rather than treating their absence as a bug to route around.

## Commands

The workspace uses **pnpm** (`pnpm-workspace.yaml` globs `packages/*` and `apps/*`). There is no root `package.json` yet, so run per-package or with `--filter`.

```bash
pnpm install                      # install all workspace deps (run at repo root)

# The client app (apps/client) — the interactive 3D portfolio:
pnpm --filter client dev          # Vite dev server (HMR)
pnpm --filter client build        # tsc -b && vite build
pnpm --filter client preview      # serve the production build
pnpm --filter client lint         # eslint .
# equivalently: cd apps/client && pnpm dev | build | preview | lint

# Storybook (every component has a colocated *.stories.tsx):
pnpm --filter client storybook        # Storybook dev server on :6006
pnpm --filter client build-storybook  # static build -> storybook-static/ (gitignored)

# Tests (Vitest 4, two projects):
pnpm --filter client test             # node unit + browser (Chromium) story tests
pnpm --filter client test:unit        # node-only logic tests (e.g. scrub.test.ts)
pnpm --filter client test:storybook   # browser story tests only
```

**Testing is configured** via Vitest 4 with two projects (`apps/client/vitest.config.ts`):
a `unit` project (node env — the pre-existing logic tests like `scrub.test.ts`) and a
`storybook` project that runs every `*.stories.tsx` as a real-browser test through
`@storybook/addon-vitest` (Playwright/Chromium — this is where R3F/WebGL components
actually render). Scene stories assert **smoke-mount** (renders without throwing), DOM
stories run `play()` interactions + a11y. `pnpm test` clears the SB dep-optimizer cache
first so runs are deterministic. See `apps/client/README.md` for the story conventions
and `.storybook/` for the framework config + decorators.

The Rust side has no working `Cargo.toml`, so `cargo build` will not work until the workspace and member crates are defined.

## Client app stack

`apps/client` targets bleeding-edge versions — keep this in mind when checking APIs and lint rules:

- **React 19** with the **React Compiler** enabled. `vite.config.ts` wires it via `@rolldown/plugin-babel` + `babel-plugin-react-compiler` (`reactCompilerPreset()`) on top of `@vitejs/plugin-react`. Do not hand-add `useMemo`/`useCallback` reflexively — the compiler handles memoization; only optimize with evidence.
- **Vite 8**, **TypeScript ~6.0**, **ESLint 10** (flat config in `eslint.config.js`), **typescript-eslint 8**.
- **React Three Fiber** ecosystem: `@react-three/fiber` 9, `@react-three/drei`, `@react-three/cannon` + `@pmndrs/cannon-worker-api` (physics in a worker), `@react-three/offscreen` (render in a worker/OffscreenCanvas), `three` 0.184 (+ `@types/three`), `@use-gesture/react`, and `uikit` (in-canvas UI). Routing is `react-router-dom` 7; scene state is `zustand` 5.

## Portfolio architecture (`apps/client`)

`apps/client` is the **interactive 3D portfolio** (spec: `docs/specs/SPEC-001-r3f-portfolio.md`). It is a **hybrid** app: a scroll-driven 3D landing at `/` plus routed DOM detail pages at `/projects/:id`.

- **Entry/routing:** `src/App.tsx` wires `createBrowserRouter` → `Layout` (`components/Layout.tsx` = `Loader` + `Nav` + `<Outlet/>`) with `routes/Landing.tsx` (index) and `routes/ProjectDetail.tsx`.
- **The 3D scene lives in `src/three/`.** `Landing` mounts one `<Canvas>` + drei `ScrollControls`; `SceneContent` assembles lights, `CameraRig` (scroll-driven, frame-damped camera — **no GSAP/framer-motion**, uses `THREE.MathUtils.damp`), `LayeredBackdrop`/`GlassLayer`/`LogoSpin` (the brand glass-depth primitives), and `ProjectCollection`.
- **Collection + lens:** `ProjectCollection` renders one stable `ProjectCard` per project and recomputes each card's target transform from the active **lens** (`tier` ↔ `domain`, toggled by `components/LensToggle.tsx`); cards damp into the new arrangement. The collection's depth is published to the store so `CameraRig` and `Contact` adapt (`useScene.contactY`).
- **State:** `src/stores/useScene.ts` (zustand) — `ready`, `section`, `hovered`, `lens`, `contactY`, `reducedMotion`.
- **Data (real content):** `src/data/projects.ts` (the ~20 showcase projects, typed; `Tier`/`Domain` are **unions, not enums** — `erasableSyntaxOnly`), `src/data/domains.ts` (canonical domains from `LayedIntrests.md`), `src/data/social.ts`.
- **Cross-Canvas gotcha:** router context is **not** bridged into the R3F Canvas — `Landing` captures `useNavigate()` on the DOM side and passes an `onOpen(id)` callback down to `ProjectCard`. Don't call router hooks inside the Canvas.
- **Lint nuance:** `eslint.config.js` disables `react-hooks/immutability` + `react-hooks/refs` **only for `src/three/**`** — R3F's per-frame mutation of three objects is intentional and conflicts with the React-Compiler lints. Keep those rules on everywhere else.
- The empty `packages/*` are the future home for extracted primitives (`shaders`, `particles`, `stylekit`, …); the `@react-three/offscreen`, `cannon`, `uikit`, and `crates/*` WASM tracks are deferred (spec §10).

## development/reference-only — vendored study material, do not edit or commit

`.gitignore` ignores exactly one path: `development/reference-only`. It holds large **cloned third-party repos kept as reference** while building the portfolio: `gltfjsx`, `uikit`, `react-three-offscreen`, `portfolio`, `mohitvirli.github.io`. These are read-only examples to learn patterns from. Never modify them, never stage them, and don't treat their code as part of this project's source.

## Profile generation (the committed half)

The profile's dynamic assets are produced by CI, not by hand:

- `.github/workflows/repo-cards.yml` runs `.github/scripts/generate-repo-cards.py` to regenerate the repo-card SVGs in `assets/repo-cards/` (on push to `main`, weekly cron, and manual dispatch); it auto-commits the result.
- `.github/workflows/snake.yml` generates the contribution-snake animation (daily cron + dispatch).

If you change repo-card or stats SVGs, prefer regenerating via the script/workflow over editing SVGs by hand. `LayeredShowcase.md` and `LayedIntrests.md` are hand-maintained domain/project maps that mirror the "Featured Projects" / "Areas of Focus" sections in `README.md` — keep them consistent with each other when editing one.

## Repo hygiene notes

- `node_modules/` is **not** gitignored yet — be careful not to stage it. When adding to `.gitignore`, include `node_modules/` (and likely `dist/`, `target/`).
- `.DS_Store` is tracked and shows as modified; it is macOS noise, not a real change.
