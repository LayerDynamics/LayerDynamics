# Plan: Storybook for every component in `apps/client`

**Date:** 2026-06-01
**Scope:** `apps/client` only
**Goal:** Stand up Storybook 10 and author a story for **every single rendering
component** (39 components) in the interactive 3D portfolio, with full test
integration (browser-mode story tests + a11y), all core addons, and rich
per-component parameterization (`argTypes`/controls).

---

## 1. What we're building (product framing)

`apps/client` is a **hybrid R3F portfolio**: a scroll-driven 3D landing (`/`)
plus routed DOM detail pages (`/projects/:id`). Its components fall into three
worlds that each need a different Storybook decorator stack:

1. **DOM components** — `Nav`, `Layout`, `Loader`, `LensToggle`, and the
   `HireMe/*` contact form. Plain React; some need a router or the zustand store.
2. **R3F scene components** — 29 components under `src/components/scene/**`. Every
   one must render **inside a `<Canvas>`**; ~12 read the `useScene` store; ~6 read
   drei `ScrollControls` (`useScroll`); three load GLTF assets.
3. **Routes / pages** — `Landing` (full Canvas + router bridge) and
   `ProjectDetail` (DOM page using `useParams`).

The Storybook is not just a gallery: per the decisions below it doubles as a
**real-browser regression test suite** (WebGL renders under Playwright) and an
**a11y harness** for the DOM/form surface.

---

## 2. Confirmed decisions (from planning Q&A)

| Decision | Choice |
| --- | --- |
| **Coverage** | **EVERYTHING** — Layouts, Containers, roots, routes/pages, `SceneContent`, composites. All 39 rendering components. |
| **Testing** | **addon-vitest browser-mode (Playwright) + play tests** **and** **a11y checks** (chosen options 1 + 3). Stories run as tests; DOM stories get interaction + axe assertions. |
| **Addons** | Autodocs, A11y, Controls & Actions (core/essentials), Backgrounds & Themes — **plus heavy parameterization** (`argTypes` on every component). |
| **R3F frameloop** | **`frameloop="always"`** — animations/damping/scrub play and are observable. |

Scope is user-confirmed as exhaustive — **do not trim the 39**. We only gate the
bulk authoring behind two proof pilots (§6).

---

## 3. Stack & feasibility (verified 2026-06-01)

- **Storybook `10.4.1`** (latest). `@storybook/react-vite@10.4.1` peers:
  `vite ^5||^6||^7||^8`, `react ^19`, `storybook ^10.4.1`. → **Vite 8 + React 19
  supported.** (Vite 8 Rolldown support: storybook issue #33789 closed.)
- **`@storybook/addon-vitest@10.4.1`** peers: `vitest ^3||^4`,
  `@vitest/browser ^3||^4`, `@vitest/browser-playwright ^4`. → matches the
  installed **vitest `4.1.8`**.
- Node `v24.8.0`, npm `11.6.0`, drei `10.7.7`, three `0.184`.

Storybook's react-vite builder uses **its own** Vite config (it runs
`@vitejs/plugin-react` but **not** the React Compiler). The project's
`vite.config.ts` adds `babel({ presets: [reactCompilerPreset()] })` via
`@rolldown/plugin-babel` — we must re-add this in `viteFinal` to match prod
compilation (see §5.1, Risk R3).

---

## 4. Component inventory (all 39)

> `C` = needs `<Canvas>`; `S` = needs `useScene` store seed; `Scroll` = needs
> drei `ScrollControls`; `R` = needs router; `GLTF` = loads a model asset.

### DOM (8)
| Component | File | Decorators |
| --- | --- | --- |
| `Nav` | `components/Nav.tsx` | R |
| `Layout` | `components/Layout.tsx` | R (Outlet) |
| `Loader` | `components/Loader.tsx` | S |
| `LensToggle` | `components/LensToggle.tsx` | S |
| `HireMe` | `components/HireMe/HireMe.tsx` | — |
| `HireMeContainer` | `components/HireMe/HireMeContainer.tsx` | — (form hook) |
| `HireMeForm` | `components/HireMe/HireMeForm.tsx` | — (props) |
| `HireMeLayout` | `components/HireMe/HireMeLayout.tsx` | — (props) |

### Scene — presentational Layouts (7) — `C`
`ContactLayout`, `HeroLayout`, `LayeredBackdropLayout`, `MeshProcessingLayout`,
`ProjectAccentLayout`, `ProjectCardLayout`, `ProjectCollectionLayout`.

### Scene — Containers (7) — `C` + `S` (+ `Scroll` where noted)
`ContactContainer` (C,S,Scroll), `HeroContainer` (C,S,Scroll),
`LayeredBackdropContainer` (C,S), `MeshProcessingContainer` (C,S,Scroll,GLTF),
`ProjectAccentContainer` (C,S), `ProjectCardContainer` (C,S),
`ProjectCollectionContainer` (C,S).

### Scene — roots (the `X.tsx` that selects Container) (7) — `C` (+ deps of child)
`Contact`, `Hero`, `LayeredBackdrop`, `MeshProcessing`, `ProjectAccent`,
`ProjectCard`, `ProjectCollection`.

### Scene — standalone leaves (7) — `C`
`CameraRig` (C,S,Scroll), `Effects` (C, postprocessing), `GlassLayer` (C),
`LogoSpin` (C,S), `Starfield` (C,S), `PrintingLevel` (C,S,Scroll,GLTF),
`Ender5Pro`/`Model` (C,GLTF — Draco).

### Composite (1) — `C` + `S` + `Scroll`
`SceneContent` — orchestrates the whole scene graph.

### Routes / pages (2)
`Landing` (C,Scroll,R-bridge — full landing), `ProjectDetail` (R, DOM page).

**Excluded (not rendering components):** `App.tsx`, `main.tsx` (bootstrap);
hooks, `lib/*`, `data/*`, `stores/*`, `styles/*`, `*.test.ts`, `constants.ts`,
`shaders.ts`, `scrub.ts`, `submit.ts`, `types.ts`, `index.ts`.

---

## 5. Architecture

### 5.1 Config files (created under `apps/client/`)
- **`.storybook/main.ts`** — framework `@storybook/react-vite`; `stories`
  glob `../src/**/*.stories.@(ts|tsx)`; addons: `@storybook/addon-docs`,
  `@storybook/addon-a11y`, `@storybook/addon-vitest`, `@storybook/addon-themes`
  (backgrounds/controls/actions are core in SB10). **`staticDirs: ['../public']`**
  so `/assets/*` resolves. **`viteFinal`** merges
  `babel({ presets: [reactCompilerPreset()] })` (Risk R3) and self-hosted Draco
  (Risk R2).
- **`.storybook/preview.tsx`** — global parameters (backgrounds incl. brand dark
  from `styles/brand.ts`), a11y config, and **global decorators registry**.
- **`.storybook/decorators.tsx`** — the reusable decorators:
  - `withRouter` — wraps in a `MemoryRouter` (+ a `Routes`/`Outlet` shim for
    `Layout`). Honors the cross-Canvas rule (router stays DOM-side).
  - `withStore(seed)` — calls `useScene.setState(seed)` before render and
    **resets to initial on unmount** so stories don't leak state.
  - `withCanvas({ frameloop:'always', camera, scroll })` — wraps R3F children in
    `<Canvas frameloop="always">`; optional drei `<ScrollControls pages damping>`
    when `scroll` is set. Fixed pixel size so snapshots are deterministic.
- **`vitest.config.ts`** (NEW) — a **`projects`** array (Risk R1):
  - `unit` project — node env, includes existing `**/*.test.ts` (`scrub.test.ts`).
  - `storybook` project — `@storybook/addon-vitest/vitest-plugin`, browser mode
    via `@vitest/browser-playwright` (chromium), includes `**/*.stories.tsx`.
  Keeps the existing `pnpm test` working and isolates browser tests.
- **`package.json`** scripts: `storybook` (dev), `build-storybook`, and
  `test-storybook` (or fold story tests into `test` via the projects config).

### 5.2 Story conventions
- One `*.stories.tsx` colocated next to each component (CSF3, `Meta`/`StoryObj`).
- **Parameterization:** every component declares `argTypes` for its scalar/
  text/color/boolean/vector props with controls. **Honest limit (Risk R5):**
  props typed as `THREE.BufferGeometry`, materials, or callbacks get
  *fixtures/actions*, **not** live controls — the story notes this.
- Real data from `src/data/*` (projects, domains, social) feeds card/collection
  stories — no invented content.
- DOM stories include a `play()` with Testing-Library interaction assertions
  (e.g. HireMe form fill/validate) and run axe via addon-a11y.

---

## 6. Risks → early gates

| # | Risk | Mitigation / where decided |
| --- | --- | --- |
| **R1** | **R3F-in-headless-WebGL flakiness.** Memory `client-redesign-verification-rig` notes a **software-render caveat** on this machine; 25+ `frameloop="always"` canvases as browser tests may be slow or render under software GL. | **Define what a scene story-test asserts: smoke-mount** ("renders without throwing"; store/props wired; expected node count), **not pixel diffs.** Pixel/visual is GPU-dependent and out of scope for CI. Proven in **Pilot 2**. |
| **R2** | **Draco/`useGLTF` offline hang.** `Ender5Pro.glb` is `KHR_draco_mesh_compression`; drei 10.7.7 defaults the Draco decoder to a **gstatic CDN** fetch → hangs in Suspense with no network. Affects `Ender5Pro`, `PrintingLevel`, `MeshProcessingContainer`. | Self-host the Draco decoder (copy `three/examples/jsm/libs/draco/` into `public/` and `useGLTF.setDecoderPath` or drei config) **and** `staticDirs:['../public']`. If self-hosting proves heavy, scope those 3 stories' **tests** to skip and keep them as visual-only. Decided in **Pilot 2**. |
| **R3** | **React Compiler not applied** by Storybook's builder → components render uncompiled (behavior parity drift, not a crash). | `viteFinal` re-adds `babel({ presets:[reactCompilerPreset()] })`. Proven in **Pilot 1**. |
| **R4** | **Vitest project collision** — existing node `scrub.test.ts` vs new browser story tests share one config. | `vitest.config.ts` `projects` split (§5.1). Proven in **Pilot 1**. |
| **R5** | **"Parameterize everything" overpromise** — three/material/callback props can't be live controls. | Story convention §5.2 states which props get controls vs fixtures. |

---

## 7. Tasks (bite-sized, pilot-gated)

> Per `pacing-spread-it-out`: small slices, check in after each phase. **Do not
> start Phase 3 until both pilots are green.**

### Phase 0 — Install & base config
- [ ] 0.1 `pnpm --filter client add -D` Storybook 10.4.1 set: `storybook`,
  `@storybook/react-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`,
  `@storybook/addon-vitest`, `@storybook/addon-themes`,
  `@vitest/browser`, `@vitest/browser-playwright`, `playwright`.
- [ ] 0.2 `npx playwright install chromium`.
- [ ] 0.3 `.storybook/main.ts` (framework, addons, `staticDirs`, `viteFinal`).
- [ ] 0.4 `.storybook/preview.tsx` (backgrounds/brand, a11y params).
- [ ] 0.5 `.storybook/decorators.tsx` (`withRouter`, `withStore`, `withCanvas`).
- [ ] 0.6 `vitest.config.ts` `projects` split (unit + storybook browser).
- [ ] 0.7 `package.json` scripts (`storybook`, `build-storybook`, story tests).
- [ ] 0.8 Self-host Draco decoder into `public/` (Risk R2 prep).
- [ ] **Verify:** `pnpm --filter client storybook` boots to an empty SB; existing
  `pnpm --filter client test` (node `scrub.test.ts`) still passes.

### Phase 1 — DOM pilot (GATE A) → proves R3, R4, a11y, play tests
- [ ] 1.1 `HireMeForm.stories.tsx` — props-driven, `argTypes`, `play()` fill +
  validation assertions, a11y pass.
- [ ] 1.2 `Nav.stories.tsx` — `withRouter`, active-link state.
- [ ] **Verify:** both render in SB; story tests pass in **browser project**;
  `scrub.test.ts` still passes in **unit project**; axe clean; confirm compiled
  output (React Compiler applied). **Stop & check in.**

### Phase 2 — R3F pilot (GATE B) → proves R1, R2, Canvas/store/scroll stack
- [ ] 2.1 `GlassLayer.stories.tsx` — simplest `withCanvas` leaf, `argTypes` for
  color/opacity/position; smoke-mount test.
- [ ] 2.2 `Ender5Pro` (`Model`) story — `withCanvas` + **Draco asset** loading;
  decide test = smoke-mount or visual-only.
- [ ] 2.3 `ProjectCardContainer.stories.tsx` — `withCanvas` + `withStore` seed +
  real project data; confirms store-seeded scene renders headless.
- [ ] **Verify:** all three render in SB with animation playing
  (`frameloop="always"`); Draco model loads from self-hosted decoder; smoke-mount
  tests pass headless without hanging. **Stop & check in** — confirm the scene
  test contract (smoke vs visual) before fan-out.

### Phase 3 — DOM fan-out (remaining 6)
- [ ] `HireMe`, `HireMeContainer`, `HireMeLayout`, `Loader` (withStore),
  `LensToggle` (withStore), `Layout` (withRouter + Outlet shim).
- [ ] **Verify:** all render + tests/a11y pass.

### Phase 4 — Scene Layouts fan-out (7, presentational)
- [ ] `ContactLayout`, `HeroLayout`, `LayeredBackdropLayout`,
  `MeshProcessingLayout`, `ProjectAccentLayout`, `ProjectCardLayout`,
  `ProjectCollectionLayout` — each `withCanvas`, props via `argTypes`, real data.
- [ ] **Verify.**

### Phase 5 — Scene roots + remaining Containers (13)
- [ ] Roots: `Contact`, `Hero`, `LayeredBackdrop`, `MeshProcessing`,
  `ProjectAccent`, `ProjectCard`, `ProjectCollection`.
- [ ] Containers: `ContactContainer`, `HeroContainer`, `LayeredBackdropContainer`,
  `MeshProcessingContainer` (GLTF), `ProjectAccentContainer`,
  `ProjectCollectionContainer` (withStore + withCanvas + ScrollControls where used).
- [ ] **Verify.**

### Phase 6 — Standalone leaves + composite (remaining)
- [ ] `CameraRig`, `Effects`, `LogoSpin`, `Starfield`, `PrintingLevel` (GLTF),
  `SceneContent` (full stack: Canvas + Scroll + store).
- [ ] **Verify** `SceneContent` renders the assembled graph headless.

### Phase 7 — Routes / pages (2)
- [ ] `Landing.stories.tsx` (full Canvas + Scroll; `onOpen` action), 
  `ProjectDetail.stories.tsx` (withRouter + `:id` param via data).
- [ ] **Verify.**

### Phase 8 — Wrap-up
- [ ] 8.1 `build-storybook` succeeds clean (no missing-asset/console errors).
- [ ] 8.2 Full `test` run: unit (node) + all story tests (browser) green.
- [ ] 8.3 Autodocs render for every component; a11y violations triaged.
- [ ] 8.4 Update `apps/client/README.md` + root `CLAUDE.md` "Commands" with the
  Storybook + story-test commands. Note `.gitignore` for `storybook-static/`.
- [ ] 8.5 Decide CI: is `build-storybook` + story tests added to a workflow?
  (out-of-scope toggle — flag to user).

---

## 8. Verification (definition of done)

1. `pnpm --filter client storybook` boots; **all 39 components** have at least one
   story, organized by the §4 categories.
2. `pnpm --filter client build-storybook` produces `storybook-static/` with **zero
   errors** and no failed asset loads.
3. Test run is green in **both** vitest projects: node unit (`scrub.test.ts`
   unchanged) + browser story tests (smoke-mount for scene, interaction+axe for
   DOM). No hangs from Draco/CDN.
4. Every component story exposes `argTypes` controls for its parameterizable
   props; non-parameterizable (three/material/callback) props documented as such.
5. React Compiler confirmed active in the Storybook build (parity with prod).
6. No `git stash`, no destructive ops; new files only under `apps/client/`
   (`.storybook/`, `vitest.config.ts`, `*.stories.tsx`, self-hosted Draco in
   `public/`). `storybook-static/` gitignored.

---

## 9. Open items to confirm with user
- **Draco test policy** (R2): self-host decoder so the 3 GLTF stories run as
  tests, **or** mark those 3 as visual-only (untested)? — finalized in Pilot 2.
- **Scene test contract** (R1): smoke-mount only (recommended) vs attempting
  visual snapshots (needs real GPU / may be excluded from CI).
- **CI integration** (8.5): add Storybook build + story tests to a GitHub
  workflow, or keep local-only for now?

---

## 10. Execution outcome (2026-06-01)

Executed inline, phase-gated. **All gates passed; every component covered.**

- **Inventory grew 39 → 51 mid-execution:** a parallel "levels" architecture
  refactor (LevelScene/LevelStage/LevelCamera, `levels/*Level`, LevelInput/
  Transitions/Indicator, `lights`) landed during the work and rewired `Landing`
  off `SceneContent`. Per user direction, all 12 new components were storied too
  (Phase 6b), and both routes (Phase 7). `PrintingLevel` lost its `scrollProgress`
  prop mid-run (now reads `stores/levelScroll`) — its story was updated to match.
- **Coverage: 51/51 components have a colocated `*.stories.tsx`** (0 missing).
- **Tests: 53 files / 99 tests green** (`pnpm test`): node unit (`scrub.test.ts`)
  + browser story tests (Chromium). `tsc -b` clean, `eslint .` clean,
  `build-storybook` succeeds.
- **Risks resolved:** R1 → smoke-mount contract (`.storybook/sceneTest.ts`);
  R2 → self-hosted Draco in `public/draco/` + an end-to-end decode assertion in
  the Ender5Pro story; R3 → React Compiler confirmed in built chunks; R4 →
  `vitest.config.ts` projects split. **New:** the Vite dep-optimizer reload race
  was made deterministic via `optimizeDeps.entries` (crawl all stories at startup)
  + `test`/`test:storybook` clearing the SB optimizer cache (`rimraf`).
- **Snags fixed, not deferred:** `tslib` hoist for recast (`.npmrc`), esbuild
  build approval (`pnpm.onlyBuiltDependencies`), `eslint` ignoring
  `storybook-static/`, and scoping `react-hooks/rules-of-hooks` +
  `react-refresh/only-export-components` off for `.storybook/**` (decorator HOCs).
- **Still open for the user:** CI integration (8.5) — Storybook build + story
  tests are **not** yet wired into a GitHub workflow.
