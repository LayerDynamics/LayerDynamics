# SPEC-002 — Immersive Levels Restructure

> Convert the LayerDynamics 3D portfolio landing from one continuous scroll into discrete, scroll-driven **levels** (Hero → 3D Processing → 3D Printing → Other Work → HireMeForm) separated by hard, fully-tearing-down transitions, so no level's elements ever render or run partially while another is on screen.

| Field | Value |
|-------|-------|
| **Spec ID** | SPEC-002 |
| **Slug** | `immersive-levels` |
| **Status** | Draft — owner discovery captured 2026-06-01; awaiting approval before implementation |
| **Owner** | Ryan O'Boyle (Layer Dynamics) — `layerdynamics@proton.me` |
| **Target** | `apps/client` (pnpm + Vite workspace package) |
| **Author** | Drafted with Claude Code (`/lore:project-spec-writer`), corrected via owner discovery |
| **Date** | 2026-06-01 |
| **Supersedes** | The single continuous-scroll descent defined in SPEC-001 §4 (CameraRig + ScrollControls world). SPEC-001's content (projects, brand, mesh-processing showcase, HireMe form) is **retained and re-housed**, not discarded. |
| **Related** | SPEC-001 (`docs/specs/SPEC-001-r3f-portfolio.md`); root `CLAUDE.md`; scene memory `scene-architecture-components-scene.md` |

> **Decisions captured from owner discovery (2026-06-01):**
> 1. **Levels are a true teardown.** Exactly one non-transition level is mounted at a time; a transition unmounts the outgoing level before the incoming one runs.
> 2. **3D Printing is new content:** a real **Ender 5 Pro** — owner has the **STEP file**; this spec covers the full pipeline (STEP → Blender rig → web-optimize → glTF → animate in R3F). The printer performs **mechanical print motion** (gantry / X-carriage / bed move as if printing).
> 3. **3D Processing** = the existing mesh→point-cloud logo showcase, repackaged as a self-contained level.
> 4. **Other Work** = the ~20 code-project grid from SPEC-001. The **tier↔domain lens toggle is dropped**; the level structure is now the organizing principle.
> 5. **Transitions auto-play under a scroll lock** with a fixed wall-clock duration (identical timing on every screen). The exact transition *visual* is deferred (see OQ-1).
> 6. **Navigation is bidirectional** (scroll down advances, scroll up reverses the transition) with **no direct jump** between non-adjacent levels.

---

## 1. Background

### 1.1 Problem Statement

The current landing is a single `ScrollControls` world in which the camera descends past sections that all coexist in 3D space (`Hero` at Y≈0, the `MeshProcessing` self-hold band over scroll-offset 0.14–0.44, the `ProjectCollection` grid at Y≈−32, `Contact`/HireMe below). Because every section is mounted simultaneously and the camera merely flies past, content from adjacent sections is frequently **partially on screen at once** — a card grid creeping into frame while the mesh pipeline is still finishing, the contact footer bleeding up under the last row, etc. The owner experiences this as "elements scattered" and wants the opposite: a curated, **immersive, level-by-level** experience where each chapter owns the full viewport and nothing leaks across boundaries.

### 1.2 Current State

Implemented per SPEC-001 (M1–M6), living under `apps/client/src/components/scene/**`:

- **Single continuous scroll:** `routes/Landing.tsx` mounts one `<Canvas>` + drei `<ScrollControls pages={8}>`; `scene/lib/layout.ts` (`SCENE`, `PROCESS`, `GRID`) defines world-space Y positions.
- **Camera:** `scene/CameraRig/useCameraRig.ts` lerps camera Y from `cameraTopY` (1) to `contactY` by `scroll.offset`, derives the active `Section` from offset thresholds, and writes it to the store.
- **Sections (all mounted at once):** `Hero`, `MeshProcessing` (scroll-scrubbed logo pipeline that self-holds in front of the camera over its band), `ProjectCollection` (tier/domain lens, centered grids, publishes `contactY`), `Contact` (social links → HireMe).
- **State:** `stores/useScene.ts` (`ready`, `section`, `hovered`, `lens`, `contactY`, `reducedMotion`).
- **Assets:** real GLB/glTF/STEP under `public/assets/objects/` (e.g. `LayerDynamicsLogo.glb`); fonts under `public/fonts`.
- **Post:** `scene/Effects/Effects.tsx` (Bloom + Vignette via `@react-three/postprocessing`).

Why it's insufficient: the continuous model **cannot** guarantee single-chapter framing. It is built on the premise that all content shares one world the camera traverses, so "clear everything and present exactly one level" is not expressible without inverting the architecture.

### 1.3 Target Users

Prospective employers, collaborators, and peers visiting the LayerDynamics GitHub-profile site. They arrive on a range of devices (laptop, ultrawide, tablet, phone) and aspect ratios, often scrolling quickly. They need a guided, legible tour of the work that reads as a deliberately authored experience — and that itself demonstrates the graphics/systems skill it advertises.

### 1.4 Motivation

The portfolio *is* a portfolio piece. A scattered continuous scroll undersells the craft; a precisely choreographed, level-based descent — including a bespoke, rigged, web-optimized Ender 5 Pro animation — is a stronger demonstration than any single repo card. The owner wants to ship the restructure now, while the scene architecture is fresh and only the profile half of the repo is on `main`.

### 1.5 Assumptions

- A1. The owner possesses a usable **Ender 5 Pro STEP file** with enough fidelity to identify and separate the moving assemblies (bed/Y, gantry/Z, X-carriage/hotend, extruder).
- A2. Blender + the connected Blender MCP add-on are available for the STEP→rig→optimize stages (the session has `mcp__blender__*` tools).
- A3. The `development/reference-only/gltfjsx` clone is available to scaffold the typed R3F component for the exported GLB.
- A4. The existing brand system (`styles/brand.ts`), Bloom/Vignette post, fonts, and the HireMe form (Web3Forms + Discord, per commit `b50d0a1`) remain valid and are reused.
- A5. Target hardware floor is a modern laptop integrated GPU; the experience may degrade (not break) on low-end mobile.
- A6. No backend/runtime change: this remains a static SPA built by Vite and served with SPA history-fallback (per SPEC-001).

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-1 | MUST | The landing MUST present exactly four non-transition levels in order: `hero`, `processing`, `otherWork`, `hireMe`. **The Hero IS the printer** — the Ender 5 prints the owner's name (no separate standalone printing level; see Decision Log 2026-06-02). |
| FR-2 | MUST | At any instant the system MUST have **at most one** non-transition level mounted in the scene graph; advancing or reversing MUST unmount the outgoing level's heavy content before the incoming level begins running its own animation. |
| FR-3 | MUST | Between two adjacent levels the system MUST play a **transition** that fully occludes/clears the viewport such that no element of either the outgoing or incoming level is visible or audibly/visually "running" during the swap. |
| FR-4 | MUST | A transition MUST run for a **fixed wall-clock duration** (configured in code, e.g. ~900 ms) that is **independent of screen size, aspect ratio, pixel ratio, and frame rate**. |
| FR-5 | MUST | While a transition is playing, scroll/wheel/touch input that would advance or reverse MUST be **locked** (ignored for level-change purposes) until the transition completes. |
| FR-6 | MUST | Forward scroll intent past the end of a level MUST advance to the next level; reverse scroll intent past the start MUST return to the previous level, **playing the transition in reverse**. There is no jump to non-adjacent levels. |
| FR-7 | MUST | The `processing` level MUST reproduce the existing mesh→point-cloud logo pipeline (Solid→Surface→Point cloud→Segmentation→Decimation→Variation) as a self-contained, mount/unmount-safe level (GPU resources disposed on unmount). |
| FR-8 | MUST | The `printing` level MUST render a **rigged, web-optimized Ender 5 Pro** (produced from the owner's STEP file) that performs **mechanical print motion** — the bed descends (vertical/Z), the gantry advances (front-back), and the carriage/hotend sweeps (left-right) along the printer's real axes as if printing. Realized as **baked glTF animation clips** on the named rig nodes (one translation clip per mover), not per-frame node math. |
| FR-9 | MUST | The `otherWork` level MUST present the ~20 code projects from `data/projects.ts` as an interactive collection; clicking a project MUST open its detail route (`/projects/:id`) exactly as today. The **tier↔domain lens toggle MUST be removed**. |
| FR-10 | MUST | The `hireMe` level MUST present the existing HireMe form path (Web3Forms email + Discord alert) reachable as the final level. |
| FR-11 | MUST | Reduced-motion (`prefers-reduced-motion: reduce`) MUST be honored: transitions collapse to an instant cut, level animations snap to a representative static pose, and no continuous idle motion plays. |
| FR-12 | MUST | The active level (and transition phase) MUST be reflected in shared state so non-Canvas UI (loader, level indicator) and the Canvas agree on a single source of truth. |
| FR-13 | SHOULD | The Ender 5 print motion SHOULD be **scrubbable by scroll** within the `printing` level: the baked clips are played paused and their `action.time` is set from in-level scroll progress (`scrubToClipTime`) via drei `useAnimations`; reaching the timeline end arms the transition. (See OQ-2.) |
| FR-14 | SHOULD | A minimal **level progress indicator** (e.g. "02 / 05" or dotted rail) SHOULD show which level the user is on and the count. |
| FR-15 | SHOULD | Heavy level assets (Ender 5 GLB, logo GLB) SHOULD **preload/prewarm** before their level is entered so a transition never reveals an unloaded level. |
| FR-16 | COULD | The transition COULD adapt its accent (color/shape) per the level being entered (e.g. printer-orange entering `printing`). |
| FR-17 | COULD | Direct deep-linking to a level via URL hash (e.g. `/#printing`) COULD be supported. |
| FR-18 | WONT | This version WILL NOT support jumping directly between non-adjacent levels (no level menu/jump). |
| FR-19 | WONT | This version WILL NOT add new backend services, accounts, or persistence beyond what the HireMe form already uses. |
| FR-20 | WONT | This version WILL NOT retain the continuous camera-descent model or the tier↔domain lens toggle. |

### 2.2 Non-Functional Requirements

This is a client-only static SPA; classic service NFRs (multi-tenant throughput, availability SLAs, RBAC) are **N/A** and noted as such. The load-bearing NFRs are rendering performance, asset weight, perceptual timing, robustness across viewports, and accessibility.

#### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Steady-state frame rate (mid laptop iGPU, 1080p) | ≥ 55 fps inside a level; never sustained < 30 fps | Browser perf overlay / `stats.js` during manual QA on reference machine |
| Transition smoothness | No dropped-frame hitch > 100 ms during a transition | Performance trace of a forward/back transition |
| Initial load to interactive Hero | First level interactive ≤ 3.0 s on a warm cache, ≤ 6.0 s cold (reference laptop, throttled "Fast 3G" cold) | Manual + Lighthouse TTI on the `/` route |
| Ender 5 GLB payload | ≤ 3.0 MB transferred (Draco-compressed geometry; KTX2/basis textures if any) | Network panel transfer size for the printing-level asset |
| Logo GLB payload (existing) | No regression vs. current `LayerDynamicsLogo.glb` size | Network panel |

#### Reliability / Robustness

| Metric | Target |
|--------|--------|
| Cross-aspect framing | On 16:9, 16:10, 21:9, and 9:16 (≥ 360 px wide), the active level's primary subject stays fully within the safe frame and centered; no clipping | Manual QA at fixed breakpoints + emulated mobile |
| Transition determinism | Same wall-clock duration (±1 frame) regardless of fps/scroll velocity; a violent fling cannot skip a level or reveal two levels at once | Scripted fast-fling test + visual inspection |
| Teardown safety | Zero WebGL context warnings / leaked geometries-materials after 20 forward+back cycles | `WEBGL_lose_context` not triggered; heap/GPU resource count stable in devtools |

#### Accessibility

- WCAG-aligned reduced-motion behavior per FR-11.
- Keyboard: `PageDown`/`ArrowDown`/`Space` advance, `PageUp`/`ArrowUp` reverse; focus is moved to the incoming level's primary heading on arrival.
- The `hireMe` form remains fully operable without 3D (it already has a DOM form path).

#### Security & Compliance

- No new attack surface: static assets + the existing HireMe form submission (Web3Forms + Discord webhook). Secrets (form keys, webhook URL) MUST remain build-time env, never committed. Data classification: the only user-supplied data is the HireMe contact message (low sensitivity, no PII store). Auth/authz: **N/A** (public site). Compliance: **N/A**.

#### Scalability

- Content scales by **adding a level descriptor** to the level registry, not by editing the orchestrator. Project count growth is absorbed by the `otherWork` collection layout (already grid-based). No infra scaling concerns (static hosting).

### 2.3 Constraints

- C1. Stack is fixed by SPEC-001: React 19 + React Compiler, Vite 8, TS ~6 (`erasableSyntaxOnly`), R3F 9 + drei, `three` 0.184, zustand 5, react-router 7. **No GSAP / framer-motion** for the 3D motion (per existing convention; `THREE.MathUtils.damp` + clock-based timing).
- C2. ESLint disables `react-hooks/immutability` + `react-hooks/refs` **only under `src/components/scene/**`**; new level code lives there and may mutate three objects per frame; everything else keeps the rules.
- C3. Cross-Canvas router rule holds: router hooks are **not** called inside the Canvas; `Landing` captures `useNavigate()` and passes `onOpen(id)` down (FR-9).
- C4. Reference repos under `development/reference-only/` are read-only study material; never imported or committed.
- C5. `node_modules/`, `dist/`, `target/` must not be staged (repo hygiene per CLAUDE.md).

### 2.4 Explicit Non-Goals

- The continuous-descent camera model and `lens` toggle are removed (FR-20).
- No offscreen/worker rendering, cannon physics, or uikit in-canvas UI in this spec (those remain deferred per SPEC-001 §10).
- No CMS or data-driven level authoring UI; levels are defined in code.
- No audio design in this spec (transition is visual).

---

## 3. Architecture

### 3.1 System Overview

Replace the single world-traversal with a **Level State Machine** that owns which level is live, plays transitions, and locks input during them. Each level is a **self-contained R3F subtree** that mounts on enter and unmounts on exit (true teardown). A persistent thin shell (Canvas, lights, post-processing, brand backdrop) survives across levels; only level-specific heavy content cycles.

```
 DOM (router side)                         Canvas (R3F side)
 ┌───────────────────────────┐            ┌───────────────────────────────────────┐
 │ routes/Landing.tsx        │            │ <Canvas> (persistent)                 │
 │  - useNavigate → onOpen   │  onOpen    │  PersistentShell: lights, Effects,    │
 │  - <LevelInput/> (wheel/  │──────────► │   LayeredBackdrop (brand depth)       │
 │     key/touch gestures)   │            │                                       │
 │  - <LevelIndicator/>      │            │  <LevelStage>                         │
 │  - <Loader/>              │            │   ├─ activeLevel mounted (ONE of):    │
 └─────────────┬─────────────┘            │   │   HeroLevel | ProcessingLevel |   │
               │ reads/acts               │   │   PrintingLevel | OtherWorkLevel| │
               ▼                          │   │   HireMeLevel                     │
 ┌───────────────────────────┐            │   └─ <TransitionCurtain> (overlays    │
 │ stores/useLevels (zustand)│◄───────────┤        during phase==='transition')   │
 │  index, phase, direction, │  writes    │                                       │
 │  locked, advance/reverse  │            │  LevelCamera (per-level framing)      │
 └───────────────────────────┘            └───────────────────────────────────────┘

 Asset pipeline (offline, one-time, produces a committed GLB):
   Ender5.step ──Blender(MCP): tessellate→separate assemblies→parent/empties rig
              ──optimize: decimate + Draco + (KTX2) ──export── Ender5Pro.glb
              ──gltfjsx──► Ender5Pro.tsx (typed R3F component w/ named nodes)
```

### 3.2 Component Design

#### Component: `useLevels` store (`stores/useLevels.ts`)
- **Responsibility:** Single source of truth for level orchestration: current level `index`, `phase` (`'live' | 'transition'`), `direction` (`'forward' | 'back' | null`), `locked` boolean, and the `LEVELS` order. Exposes `requestAdvance()`, `requestReverse()`, `beginTransition(dir)`, `completeTransition()`.
- **Technology:** zustand 5 (same pattern as `useScene`). May absorb the still-needed bits of `useScene` (`ready`, `hovered`, `reducedMotion`) or compose alongside it.
- **Interfaces:** selectors for index/phase/locked; actions above. Pure state — no timers (the transition timer lives in the controller component so it ties to the R3F clock and unmounts cleanly).
- **Dependencies:** none beyond zustand.

#### Component: `LevelInput` (`components/LevelInput.tsx`, DOM)
- **Responsibility:** Capture user advance/reverse *intent* from wheel, touch (swipe), and keyboard, debounced/accumulated, and call `requestAdvance`/`requestReverse`. Ignores input while `locked`. Owns within-level scroll accumulation handed to the active level (for scrub levels).
- **Technology:** DOM listeners via `@use-gesture/react` (already a dependency) + keydown.
- **Interfaces:** none rendered; side-effects into `useLevels` and a shared `scrollProgress` ref consumed by scrub levels.
- **Dependencies:** `useLevels`.

#### Component: `LevelStage` (`components/scene/LevelStage/`)
- **Responsibility:** Mount exactly the active level component; on a level change, coordinate the unmount-old/mount-new ordering so teardown precedes the new level's first animated frame. Renders `TransitionCurtain` while `phase==='transition'`.
- **Technology:** R3F; conditional render keyed by `index`.
- **Interfaces:** consumes `useLevels`; passes `onOpen` through to `OtherWorkLevel`.
- **Dependencies:** the five Level components, `TransitionController`.

#### Component: `TransitionController` (`components/scene/LevelStage/useTransition.ts`)
- **Responsibility:** Drive the fixed-duration transition off the R3F clock (`useFrame` delta accumulation, **not** frame counts), advance the curtain's 0→1 progress, swap `index` at the occluded midpoint, and call `completeTransition()` + release the lock at the end. Guarantees FR-4 (wall-clock determinism) and FR-3/FR-5 (full occlusion + input lock).
- **Technology:** R3F `useFrame`, `THREE.MathUtils` easing.
- **Interfaces:** reads `direction`; writes curtain progress (ref) and store phase.
- **Dependencies:** `useLevels`.

#### Component: `TransitionCurtain` (`components/scene/LevelStage/TransitionCurtain.tsx`)
- **Responsibility:** The full-viewport occluder rendered during a transition (fullscreen quad/shader or screen-space mesh that always covers the frame regardless of aspect). Visual is deferred (OQ-1) behind a stable interface (`progress: 0→1`, `direction`).
- **Technology:** R3F fullscreen primitive (e.g. drei `<Hud>`/orthographic quad or a screen-space `ShaderMaterial`), aspect-independent by construction.
- **Interfaces:** `progress` ref, `accent` color.
- **Dependencies:** brand palette.

#### Component: `LevelCamera` (`components/scene/LevelCamera/`)
- **Responsibility:** Per-level camera framing that **centers each level's subject on any aspect ratio** (replaces the continuous `CameraRig` descent). On level enter, set/damp to that level's framing; expose a fit helper that accounts for viewport aspect so subjects never clip (FR robustness target).
- **Technology:** R3F `useThree` + `MathUtils.damp`; reuses the damp-not-tween convention from `useCameraRig`.
- **Interfaces:** reads active level's `cameraConfig`.
- **Dependencies:** `useLevels`, level registry.

#### Level components (each: single responsibility = "be one level, mount/unmount-safe")
- `HeroLevel` — brand intro (reuses `Hero` content), advance-on-scroll.
- `ProcessingLevel` — wraps the existing `MeshProcessing` pipeline, but **band math is local to the level** (0→1 over the level's own scrub) instead of the global `PROCESS` offsets; disposes geometry/material on unmount (already does). Scrub-then-advance.
- `PrintingLevel` — loads `Ender5Pro.glb` (geometry via the gltfjsx-generated `Ender5Pro.tsx`), owns a single `useAnimations` mixer that plays the three baked clips paused and scrubs their time from scroll for mechanical print motion; scrub-then-advance (FR-13). Implemented at `src/components/scene/PrintingLevel/`.
- `OtherWorkLevel` — the project grid from `ProjectCollection` minus the lens; one fixed grouping (e.g. by tier order, headers from `tierTitle`), `onOpen` routing preserved.
- `HireMeLevel` — surfaces the HireMe form as the terminal level (DOM form overlaid or the existing `/hire` path framed as a level).

#### Component: Asset pipeline tool (offline) → `public/assets/objects/Ender5Pro.glb` + `components/scene/PrintingLevel/Ender5Pro.tsx`
- **Responsibility:** Produce the rigged, web-optimized printer GLB and its typed R3F wrapper. Not runtime code; a documented, repeatable build (Blender MCP steps + gltfjsx invocation) recorded in the milestone.
- **Technology:** Blender (via `mcp__blender__*`), Draco/meshopt, gltfjsx.
- **Interfaces:** emits a GLB with **named, hierarchically-parented assemblies** (`Bed_Y`, `Gantry_Z`, `Carriage_X`, `Hotend`, `Extruder`) so R3F can animate by node name.
- **Dependencies:** owner's `Ender5Pro.step`.

### 3.3 Data Model

The new domain object is the **Level descriptor**; project data is unchanged.

```ts
// stores/useLevels.ts (shape)
type LevelId = 'hero' | 'processing' | 'printing' | 'otherWork' | 'hireMe'
type Phase = 'live' | 'transition'
type Direction = 'forward' | 'back' | null

interface LevelDef {
  id: LevelId
  /** Drives FR-13/OQ-2: does in-level scroll scrub an animation, or just advance? */
  scrollMode: 'scrub' | 'advance'
  /** Per-level camera framing (position/target/fov) consumed by LevelCamera. */
  cameraConfig: { position: [number, number, number]; target: [number, number, number]; fov: number }
  /** Optional transition accent when ENTERING this level (FR-16). */
  accent?: string
}

interface LevelsState {
  index: number              // 0..4 into LEVELS
  phase: Phase
  direction: Direction
  locked: boolean
  // actions
  requestAdvance(): void
  requestReverse(): void
  beginTransition(dir: Exclude<Direction, null>): void
  completeTransition(): void
}
```

- **`projects` / `Project`** (`data/projects.ts`) — unchanged; consumed only by `OtherWorkLevel`. `Domain`/`domains.ts` may stay for detail pages even though the lens is dropped.
- **Ender 5 rig contract** — the GLB exposes five named nodes (`Frame_Static`, `Bed_Z`, `GantryY`, `CarriageX`, `Extruder_Spin`; `CarriageX` nested under `GantryY`) and three baked translation clips (`Bed_Z`/`GantryY`/`CarriageX`, 10 s each). `PrintingLevel` binds them with `useAnimations` and scrubs `action.time` from local scroll progress. Lifecycle: authored once offline, committed, loaded at runtime with the Draco decoder; mixer stopped + GLTF cache retained on unmount.
- **Lifecycle (runtime):** level content is **created on enter, mutated per frame while live, disposed on exit**. State transitions: `live(index) → [advance/reverse] → transition(direction) → (swap index at midpoint) → live(index±1)`.

### 3.4 API & Interface Design

No network API. The internal "API" is the store action surface and the level-component contract:

- **Store actions:** `requestAdvance()`, `requestReverse()` (no-op when `locked` or at an end), `beginTransition(dir)`, `completeTransition()`.
- **Level component contract:** each level is a React component taking `{ scrollProgress: RefObject<number>; onExitArmed(dir): void; onOpen?(id): void }`. It reads `scrollProgress` for scrub, and calls `onExitArmed('forward')` when its content has reached its end so the controller may transition. (`advance` levels call `onExitArmed` immediately on any forward intent.)
- **Curtain contract:** `{ progress: RefObject<number>; direction: Direction; accent?: string }`.

### 3.5 Data Flow

**Forward advance (e.g. processing → printing):**
1. User scrolls down inside `processing`; `LevelInput` accumulates intent into `scrollProgress`.
2. `ProcessingLevel` scrubs the pipeline; when local progress hits 1.0 and forward intent continues, it calls `onExitArmed('forward')`.
3. `LevelStage`→`requestAdvance()`; store sets `phase='transition'`, `direction='forward'`, `locked=true`.
4. `TransitionController` raises the curtain (clock-timed). At the occluded midpoint it **unmounts `ProcessingLevel`** (disposing GPU resources) and increments `index` → `PrintingLevel` mounts behind the still-full curtain (its GLB was prewarmed per FR-15).
5. Curtain lowers; at completion `completeTransition()` sets `phase='live'`, `locked=false`. `PrintingLevel` begins its animation from a clean state. At no point were both levels visible (FR-3).

**Reverse** is symmetric with `direction='back'` (curtain + decrement).

**Reduced motion (FR-11):** steps 3–5 collapse — curtain duration → 0 (instant swap), level animations render a static representative pose.

### 3.6 Integration Points

- **HireMe form** — existing Web3Forms email + Discord webhook submission (`components/HireMe/submit.ts`), reused unchanged by `HireMeLevel`.
- **Router** — `/projects/:id` detail route reached via `onOpen` from `OtherWorkLevel` (DOM-captured navigate; C3).
- **Blender MCP** — offline asset stage only (not a runtime dependency).
- **Draco decoder** — runtime decode of the compressed Ender 5 GLB (drei `useGLTF`/`DRACOLoader`); decoder served from `public/`.

### 3.7 Security Architecture

Static SPA — no auth, no sessions, no datastore. The only egress is the HireMe form POST (Web3Forms) + Discord webhook, both gated by build-time env secrets that MUST stay out of git (`.env`, host env vars). Curtain/asset code introduces no user-controlled execution. Third-party GLB is authored by the owner (not user-uploaded), so no untrusted-asset surface. CSP/headers and the form's existing validation are unchanged from SPEC-001.

### 3.8 Resilience Design

- **Asset load failure:** if the Ender 5 GLB (or logo GLB) fails to load, the level MUST show a graceful brand-styled fallback (e.g. a static placard) rather than a blank Canvas; the level is still advanceable. A `Suspense` boundary per heavy level prevents a failed/slow asset from blanking the whole Canvas.
- **Fling/skip protection:** `locked` during transitions + intent accumulation (not raw delta) makes a fast fling advance **one** level, never several, and never reveals two levels (FR-4/robustness target).
- **Teardown leaks:** every level disposes geometries/materials/textures on unmount (the existing `MeshProcessing` cleanup is the template); QA cycles 20× to confirm stable GPU resource counts.
- **Reduced motion / low power:** instant-cut path doubles as a low-power fallback.

### 3.9 Observability

Dev-only: a `stats.js`/perf overlay toggle and `console`-level transition logging behind a debug flag; the `LevelIndicator` doubles as a human-visible state read-out. No production telemetry in scope (static site). Manual QA (the screenshot/CDP rig in memory `client-redesign-verification-rig.md`) is the verification channel.

### 3.10 Infrastructure & Deployment

Unchanged from SPEC-001: Vite build, static host with SPA history-fallback (Railway per memory `railway-deploy-and-main-now-holds-app.md`; Vite `preview.allowedHosts` gotcha still applies). The new Ender 5 GLB + Draco decoder are static assets under `public/`. CI/profile-generation workflows are untouched (different half of the repo).

---

## 4. Implementation Plan

Sliced for incremental delivery + check-ins (owner pacing preference): each phase lands a runnable increment.

### 4.1 Build Phases

#### Phase 1: Level state machine + transition skeleton (no new content)
- **Goal:** Prove the teardown model with the levels that already exist.
- **Scope:** `useLevels` store; `LevelInput`; `LevelStage` + `TransitionController` + a **placeholder** `TransitionCurtain` (simple fade-to-brand); `LevelCamera`; wrap existing `Hero`, `MeshProcessing`, `ProjectCollection (lens removed)`, and a stand-in printing level as the five levels. Remove `ScrollControls`/`CameraRig` descent.
- **Exit criteria:** Scroll/keys move through all five levels with one mounted at a time; transitions are fixed-duration and input-locked; reduced-motion does instant cuts; no two levels visible at once; lint + build green.

#### Phase 2: Ender 5 Pro asset pipeline (offline)
- **Goal:** Produce `Ender5Pro.glb` + `Ender5Pro.tsx`.
- **Scope:** In Blender (via MCP): import owner STEP, tessellate, separate the moving assemblies, build the parent/empty rig with the named nodes (`Bed_Y`, `Gantry_Z`, `Carriage_X`, `Hotend`, `Extruder`), set sane origins; optimize (decimate to web budget, Draco/meshopt, KTX2 if textured); export GLB; run gltfjsx to generate the typed component. Commit GLB to `public/assets/objects/`.
- **Exit criteria:** GLB loads in a scratch R3F view; each named node transforms independently; transfer size ≤ 3 MB (NFR); pipeline steps recorded in this doc's Appendix A so it's repeatable.

#### Phase 3: PrintingLevel animation
- **Goal:** Mechanical print motion wired to the level.
- **Scope:** `PrintingLevel` consumes `Ender5Pro.tsx`; per-frame drive of bed/gantry/carriage/hotend along real axes from local scroll progress (scrub) + idle; reduced-motion static pose; prewarm per FR-15; disposal on unmount.
- **Exit criteria:** Scrubbing the printing level moves the printer as if printing; advancing/reversing tears it down cleanly; no leaks over 20 cycles.

#### Phase 4: OtherWork + HireMe levels finalization
- **Goal:** Final content levels.
- **Scope:** `OtherWorkLevel` = grid without lens (one fixed grouping), `onOpen` routing intact; `HireMeLevel` frames the existing form as the terminal level; `LevelIndicator`; per-level camera framing tuned for all target aspect ratios.
- **Exit criteria:** Clicking a project opens its detail page; the form submits (Web3Forms + Discord) from the level; framing holds on 16:9/21:9/9:16; build + lint green.

#### Phase 5: Transition visual + polish (resolves OQ-1)
- **Goal:** Replace placeholder curtain with the chosen transition aesthetic; cross-screen + perf QA.
- **Scope:** Final `TransitionCurtain` visual (owner-chosen), optional per-level accent (FR-16); performance pass to NFR targets; accessibility pass (focus move, keyboard, reduced motion).
- **Exit criteria:** Meets §2.2 performance + robustness targets in manual QA; owner sign-off on the transition feel.

### 4.2 Testing Strategy

There is no test runner configured yet (CLAUDE.md). This spec **introduces a minimal harness** as part of the work rather than claiming nonexistent tests:

- **Unit (Vitest):** `useLevels` reducer logic — advance/reverse clamping at ends, `locked` ignores input, `beginTransition`/`completeTransition` phase/index transitions, reduced-motion instant path. Pure state, no Canvas — fully unit-testable.
- **Component:** the level-component contract (`onExitArmed` fires at scrub end / immediately for advance levels) via a mocked `scrollProgress` ref.
- **Manual/visual QA (the real cross-level guarantees):** the existing headless-Chrome + CDP screenshot rig (memory `client-redesign-verification-rig.md`) to verify single-level framing, no-bleed transitions, and aspect robustness at fixed breakpoints; 20× forward/back cycle for leak/teardown.
- **Perf:** `stats.js` overlay on the reference machine against §2.2.

### 4.3 Rollout Strategy

Feature-branch off `main`; the restructure replaces the landing wholesale, so it ships as one branch reviewed end-to-end (not behind a runtime flag — a half-applied restructure is worse than either state). Land Phase 1 first for an owner check-in, then Phases 2–5. Deploy preview on Railway before promoting. Rollback = revert the branch merge (the previous continuous-scroll landing is in git history).

### 4.4 Operational Readiness

Before promoting to the live profile site: NFR perf targets met on the reference machine; reduced-motion verified; HireMe form verified end-to-end (real submission → email + Discord); 20× teardown cycle clean; Draco decoder asset present in the deployed bundle; owner approval on transition visual.

---

## 5. Milestones

| Milestone | Goal | Exit Criteria | Target Date | Owner |
|-----------|------|---------------|-------------|-------|
| M1 — Level machine | Teardown state machine + placeholder transitions over existing content | FR-1..6, FR-11, FR-12 demonstrable; lint+build green | TBD (owner to set) | Ryan + Claude |
| M2 — Ender 5 asset | Rigged, web-optimized `Ender5Pro.glb` + typed component | Named nodes transform independently; ≤ 3 MB; pipeline documented (App. A) | TBD | Ryan + Claude |
| M3 — Printing level | Mechanical print motion wired & teardown-safe | FR-8, FR-13; clean over 20 cycles | TBD | Ryan + Claude |
| M4 — Content levels | OtherWork (no lens) + HireMe levels + indicator | FR-9, FR-10, FR-14; routing + form verified | TBD | Ryan + Claude |
| M5 — Transition + QA | Final transition visual; perf/a11y/cross-screen QA | §2.2 targets met; owner sign-off (OQ-1 resolved) | TBD | Ryan + Claude |

### Dependency Graph

```
M1 ──► M3 ──► M4 ──► M5
        ▲
M2 ─────┘      (M2 may run in parallel with M1; M3 needs both M1 and M2)
```

---

## 6. Success Criteria

### 6.1 Launch Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Single-level framing | 5/5 levels render with no adjacent-level bleed at all tested aspect ratios | Manual CDP screenshot QA |
| Transition determinism | 0 level-skips / double-exposures across a 30-fling stress pass | Scripted fling + visual review |
| Frame rate | ≥ 55 fps in-level on reference laptop | `stats.js` |
| Ender 5 weight | ≤ 3 MB transferred | Network panel |
| Teardown integrity | Stable GPU resource count after 20 cycles | DevTools memory/GPU inspection |
| Owner acceptance | Owner approves the immersive feel + transition visual | Sign-off |

### 6.2 Ongoing Monitoring

Static site — no runtime dashboards. Post-launch verification is the manual QA rig re-run after any scene change; the `LevelIndicator` is the in-app state read-out.

### 6.3 Remediation Triggers

- Any reproducible double-level exposure or level-skip → blocker; fix before merge.
- Sustained < 30 fps in any level on the reference machine → optimize (decimate further / reduce overdraw) before merge.
- Reduced-motion path showing continuous motion → blocker (accessibility).

---

## 7. Risks

| ID | Risk | Impact | Likelihood | Mitigation | Contingency |
|----|------|--------|-----------|------------|-------------|
| R-1 | Ender 5 STEP lacks clean assembly separation → rig parts can't move independently | High | Medium | In Blender, separate by loose parts / material / body and re-parent to empties; verify each axis before optimizing | Hand-model/simplify the few moving sub-assemblies; or reduce to gantry+bed+hotend motion only |
| R-2 | STEP→web optimization yields a too-heavy or visually degraded GLB | Medium | Medium | Budget early (decimation targets, Draco); KTX2 for any textures; check transfer size each export | Ship a lower-poly "lite" printer; lazy-load full model |
| R-3 | True teardown causes a visible blank/hitch when the incoming level's asset isn't ready | High | Medium | Prewarm/preload heavy GLBs before entering (FR-15); curtain stays up until incoming `Suspense` resolves | Extend curtain duration adaptively only until ready (still wall-clock-min), with a brand loading mark behind it |
| R-4 | Losing continuous scroll feels abrupt / users don't realize they can scroll | Medium | Medium | Level indicator + subtle "scroll to continue" affordance; reverse navigation; tuned transition easing | Add a hint pulse on idle at a level boundary |
| R-5 | Fast flings or trackpad inertia skip levels or double-fire | High | Low | Intent accumulation + `locked` during transitions; debounce; unit-test the reducer | Add a per-transition cooldown |
| R-6 | No existing test harness → regressions slip in | Medium | Medium | Stand up Vitest for the store reducer as part of M1; manual CDP QA for visual guarantees | Gate merges on the manual QA checklist |
| R-7 | GPU resource leaks across many transitions | Medium | Low | Disposal on unmount (existing pattern) + 20-cycle QA | `dispose()` audit; reuse a pooled geometry where safe |

---

## 8. Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| OQ-1 | Transition **visual**: glass wipe vs fade-through-brand vs depth-dive vs printer-themed? (Trigger/timing already locked; visual deferred to M5.) | Ryan | Before M5 |
| OQ-2 | In-level scroll policy: **resolved for `printing`** — scrub-then-advance (clip time = scroll progress via `scrubToClipTime`). Still pending for the others: **advance-on-scroll** for `hero` + `hireMe`, `otherWork` = advance (grid is browse, not scrub). | Ryan | Before M3 (printing done) |
| OQ-3 | `otherWork` grouping now that the lens is dropped: keep the three tier groups (`Featured`/`Selected`/`More Work`) as fixed sections, or a single flat grid? | Ryan | Before M4 |
| OQ-4 | Should `hireMe` be an in-Canvas framed form or the existing DOM `/hire` route presented as the terminal level? | Ryan | Before M4 |
| OQ-5 | Keep `domains.ts` for project **detail pages** even though the landing lens is gone? (Assumed yes.) | Ryan | Before M4 |
| OQ-6 | Deep-link hashes per level (FR-17) — in scope for v1 or later? | Ryan | Before M5 |

---

## Appendices

### Appendix A — Ender 5 Pro asset pipeline (executed 2026-06-01)

Repeatable, committed pipeline under `blender/scripts/` + `blender/workflows/`
(driver `build_ender5.sh`, shared config `lib_ender5.py`). Plan of record:
`docs/plans/2026-06-01-ender5-rig-animate.md`.

1. **Engine:** Blender 5.1 has no STEP importer + no FreeCAD, so `cadquery-ocp`
   (OpenCASCADE 7.9.3.1.1) is installed into Blender's bundled Python 3.13. This is
   the realization of the "Blender STEP add-on" choice and the only path that
   recovers the SolidWorks `PRODUCT` names. (Needs full deps — the `OCP` binary is
   linked against VTK.)
2. **Import** (`10_import_step.py`): `STEPCAFControl_Reader` + `XCAFDoc` walk reads the
   77 MB AP203 assembly, preserving 151 part names + per-instance placement;
   `BRepMesh` tessellation → **392 named meshes**, metre-scaled. The doc must stay
   referenced past the XCAF walk (a GC'd doc yields 0 shapes). Orientation is
   normalized Y-up→Blender Z-up (lead-screw axis → +Z), dropped to the floor.
   Verified: world bbox ≈ 0.678 × 0.485 × 0.505 m (real Ender 5 Pro envelope).
3. **Cull + group** (`20_cull_group.py`, `21_reassign.py`): drop **287 fastener
   instances**; sort the remaining **105 meshes** into `Frame_Static` / `Bed_Z` /
   `GantryY` / `CarriageX` / `Extruder_Spin` by name regex; reassign 5 spatially-
   ambiguous shared parts (pulleys/belt/hose) by bbox containment.
4. **Rig** (`30_rig.py`): one empty per group; meshes parented (keep-transform);
   **`CarriageX` nested under `GantryY`**; travel axes derived (vertical=Z from the
   lead-screw, LR=X from the x-axis-strut, FB=Y). Verified by render: bed lifts
   alone, gantry carries the carriage.
5. **Animate** (`40_animate.py`): bake a 250-frame @ 25 fps print loop — carriage X
   sweep (6 raster passes), gantry Y advance, bed Z descent. Verified by frame
   renders.
6. **Raw export** (`50_export_raw.py`): ≤4 brand PBR materials assigned by name;
   glTF-binary with named nodes + animation, +Y-up, **no Draco, no decimation** →
   gitignored intermediate `blender/assets/Ender5Pro.raw.glb` (**45.65 MB** full-res).
   Blender's job stops at authoring; web optimization is delegated to gltf-transform.
7. **Web-optimize + wrap** (`build_ender5.sh weboptimize` → `gltfjsx -T -S`): one
   command runs gltf-transform (**join compatible meshes, palette materials, prune,
   Draco**) + **meshopt simplify** (`--ratio 0.4 --error 0.001`) and generates the
   typed component. Result `apps/client/public/assets/objects/Ender5Pro.glb` =
   **2.10 MB**, **12 meshes** (down from 105 — ~9× fewer draw calls), **15 nodes**,
   3 translation clips intact, Draco. The join is animation-aware: it keeps the
   animated `Bed_Z`/`GantryY`/`CarriageX` nodes separate and prunes the static
   `Frame_Static`/`Extruder_Spin` empties (never animated) into the join.
   *This replaced an earlier hand-rolled Blender decimate + Draco export — gltf-transform
   does web optimization better and in one step (the canonical pmndrs workflow).*
8. **Component fixes** (post-gltfjsx): GLB path → `/assets/objects/Ender5Pro.glb`;
   internal `useAnimations` removed so `PrintingLevel` owns the single mixer; typed
   `GLTF` from `three-stdlib` with `as unknown as GLTFResult`; `React.JSX.IntrinsicElements`.
9. **Verify:** the optimized GLB re-imported into Blender + Cycles-rendered (silhouette
   + thin parts survive simplify at ratio 0.4); GLB decoded — 3 clips target the rig
   nodes with real translation spans (bed 0.06 m vertical, gantry/carriage 0.11 m);
   `scrubToClipTime` unit-tested; `pnpm build` + `lint` + `test` green.

> Status: **Executed.** Owner: Ryan + Claude. Renders under `blender/assets/_renders/`.

### Appendix B — Glossary

| Term | Meaning |
|------|---------|
| **Level** | A discrete, fully-mounted chapter that owns the whole viewport; exactly one is live at a time. |
| **Transition** | The fixed-duration, input-locked, fully-occluding swap between two adjacent levels. |
| **Teardown** | Unmounting a level and disposing its GPU resources so nothing of it remains running. |
| **Scrub** | Driving an animation timeline directly from accumulated scroll progress. |
| **Rig** | The named, hierarchically-parented node structure of the Ender 5 GLB that makes its assemblies independently animatable. |
| **Curtain** | The full-screen occluder that hides the level swap during a transition. |

### Appendix C — Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-01 | True-teardown state machine (not continuous + curtains) | Owner wants a hard guarantee nothing runs partially; only one-mounted-at-a-time makes that structurally true. |
| 2026-06-01 | 3D Printing = new rigged Ender 5 Pro from owner STEP, full pipeline in scope | Owner-specified content; demonstrates CAD→web→animation craft. |
| 2026-06-01 | Drop tier↔domain lens | Level structure replaces it as the organizing principle. |
| 2026-06-01 | Auto-play, scroll-locked, fixed wall-clock transitions | Owner requirement: "timing perfect no matter the screen." |
| 2026-06-01 | Bidirectional, no jump | Owner choice; keeps the state machine simple. |
| 2026-06-01 | Stand up Vitest for the level reducer | Honest testing of the one purely-logical piece; visual guarantees stay manual. |
| 2026-06-01 | Ender 5 motion = **baked glTF clips** scrubbed via `useAnimations`, not runtime node math | Owner choice; rig still authored in Blender to produce the clips. Exporter emits one translation clip per mover (all 10 s), played in lockstep. |
| 2026-06-01 | STEP→mesh via `cadquery-ocp` (OpenCASCADE) inside Blender's Python | Blender 5.1 has no STEP importer + no FreeCAD; OCP recovers the 151 SolidWorks part names that make auto-rigging tractable. |
| 2026-06-01 | Web optimization via **gltfjsx `-T -S`** (gltf-transform), not Blender decimate+Draco | Canonical pmndrs workflow: Blender authors raw, gltf-transform joins meshes (105→12 draw calls), meshopt-simplifies, palettes materials, prunes, Draco — better + one step. Animation-aware join keeps the rig clips intact. |
| 2026-06-02 | Self-host the Draco decoder (`public/draco/` via `src/draco.ts`), drop the gstatic CDN | drei defaults the decoder to Google's CDN; the Ender 5 GLB was fetching it cross-origin. Verified zero gstatic. |
| 2026-06-02 | **Hero IS the printer printing the owner's name; remove the standalone `printing` level → 4 levels** | The printer is the marquee intro. The name is a converted glTF (`Title.step`→Draco `Title.glb`) sitting on the build plate, descending with it; a fixed world clip plane at the plate's start height reveals it bottom-up ("printing"). Reusable `Printer` rig (bed descent + head raster from scroll) + `PrintedTitle` (plate-linked clip). `localClippingEnabled` on the Canvas. Bed driven directly (not the tiny baked clip) so it starts at the top. |
