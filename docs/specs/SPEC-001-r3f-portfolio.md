# SPEC-001 — Layer Dynamics Interactive 3D Portfolio

| Field | Value |
|-------|-------|
| **Spec ID** | SPEC-001 |
| **Slug** | `r3f-portfolio` |
| **Status** | Implemented (M1–M6) — owner-approved; build + lint + data-integrity green; visual/browser QA still pending |
| **Owner** | Ryan O'Boyle (Layer Dynamics) — `layerdynamics@proton.me` |
| **Target** | `apps/client` (pnpm + Vite workspace package) |
| **Author** | Drafted with Claude Code (`/lore:project-spec-writer`), corrected via owner discovery |
| **Date** | 2026-05-30 |
| **Supersedes** | Default Vite + R3F template currently in `apps/client` |
| **Related** | Implementation plan: `/Users/ryanoboyle/.claude/plans/concurrent-honking-crane.md`; root `CLAUDE.md` |

> **Decisions captured from owner discovery (2026-05-30):**
> 1. **Process** — spec-first: implementation is **paused** until this spec is approved.
> 2. **Deploy/router** — host with SPA history-fallback (Vercel/Netlify/Railway) → keep `createBrowserRouter` with clean URLs.
> 3. **Domain grouping** — add a **tier ↔ domain toggle**: re-bucket the ~20 public showcase projects into their canonical `LayedIntrests.md` domains; same cards, two lenses.

---

## 1. Overview

Layer Dynamics is building an **interactive 3D portfolio** to replace the static GitHub-profile presentation of Ryan O'Boyle's work. It is a single-page application rendered with **Three.js via React Three Fiber (R3F)**: a continuous, scroll-driven WebGL landing that descends *through layers* of depth (literalizing the "Layer Dynamics" brand) to present ~20 from-scratch engineering projects, plus routed HTML detail pages for individual projects.

Marquee behavior: **the visitor scrolls and the camera dives through translucent, glass-like strata** — hero → project collection (organized by tier *or* by domain via a toggle) → contact — and can click any project to open a focused detail page with a themed 3D accent.

This spec is the authoritative description of *what* is built and *why*. The companion implementation plan covers step-level execution.

### 1.1 Why this exists

The current `apps/client` is the unmodified Vite + React 19 + R3F starter (a counter and "Get started" links). The committed repository content (`README.md`, `LayeredShowcase.md`, `LayedIntrests.md`) is a strong but *static* profile. The portfolio turns that static catalog into a distinctive, interactive showcase that itself demonstrates the systems/graphics skill set it describes — the site is a portfolio piece, not just a list of portfolio pieces.

### 1.2 Reference works (study material, not dependencies)

Vendored under `development/reference-only/` (git-ignored, read-only):

| Reference | Stack | What we adopt |
|-----------|-------|---------------|
| `mohitvirli.github.io` | Next.js + R3F + GSAP + zustand | Single continuous scroll-driven scene; `data.range()` scroll mapping; `THREE.MathUtils.damp` camera; carousel layout math; zustand store split |
| `portfolio` (Hamish Williams) | Remix + three.js + framer-motion | Routed project detail pages; design-token system; decoder-text effect; `IntersectionObserver` reveals; GLTF+DRACO loader/cleanup utilities |
| `react-three-offscreen` | `@react-three/offscreen` | Worker/OffscreenCanvas rendering pattern (deferred — §10) |
| `uikit` | `@react-three/uikit` | In-canvas WebGL UI panels (deferred — §10) |
| `gltfjsx` | CLI | GLTF→JSX conversion for any future `.glb` models (deferred — §10) |

---

## 2. Goals, Non-Goals, Success Criteria

### 2.1 Goals
- **G1** — Present every project from `LayeredShowcase.md` (3 tiers, ~20 projects) as navigable 3D content with real metadata (name, languages, tagline, blurb, "why it matters", GitHub link, canonical domain).
- **G2** — Deliver the "layered depth / brand" aesthetic: gradient-depth background, translucent stacked/glass planes, parallax, and the brand stroke-spin logo motif.
- **G3** — Hybrid navigation: one scroll-driven 3D landing at `/` plus routed DOM detail pages at `/projects/:id`.
- **G4** — Two organizing lenses over the project collection: **by tier** (Flagship/Strong/Notable) and **by domain** (canonical `LayedIntrests.md` domains), switchable via a toggle.
- **G5** — Production build passes `tsc -b` under the package's strict TypeScript config and `vite build` succeeds with no errors.
- **G6** — Smooth (target 60 fps on a modern laptop) and accessible (keyboard-reachable links, `prefers-reduced-motion` respected, responsive to mobile).

### 2.2 Non-Goals (this version)
- A CMS / backend / contact form server — content is a typed data module in-repo.
- Blog/articles, light-mode theme switcher, or i18n.
- Per-project bespoke 3D models (`.glb`) — first pass is fully procedural.
- Surfacing **private or non-public** projects (LocalLang, the Plastiq ecosystem, geopuppet, LDO Milo, etc.) — the domain lens uses **only the ~20 public showcase repos** re-bucketed; domains with no public showcase project simply do not appear.
- Filling the empty `packages/*` workspaces or the `crates/*` WASM (see §10).

### 2.3 Success Criteria (acceptance)
- **S1** — From `/`, a visitor can scroll the full landing top-to-bottom and visibly move through the sections; the camera descends through the layered strata.
- **S2** — Hovering a project card lifts it; clicking it routes to `/projects/:id` for the correct project; the back button / "All work" returns to the landing.
- **S3** — An unknown `/projects/<bad-id>` redirects to `/`.
- **S4** — Toggling **tier ↔ domain** re-lays-out the same project cards into the other grouping; every card remains clickable.
- **S5** — `pnpm --filter client build` and `pnpm --filter client lint` both succeed with zero errors.
- **S6** — With OS reduced-motion enabled, motion is reduced (camera snaps, no looping animation); narrow viewport remains usable.
- **S7** — All ~20 projects match the names/languages/taglines in `LayeredShowcase.md`, and each carries a canonical domain from the §5.4 mapping.

---

## 3. Users & Use Cases

| User | Goal | Journey |
|------|------|---------|
| **Recruiter / hiring manager** | Quickly gauge range and depth | Lands → scrolls the collection → recognizes flagship systems (BrowserX, forge, Echelon, smlx) → maybe switches to the **domain** lens to see breadth → opens 1–2 detail pages → clicks GitHub |
| **Engineer / peer** | Inspect a specific project / area | Arrives (possibly deep-linked to `/projects/browserx`) or filters by domain → reads blurb + "why it matters" → GitHub |
| **Ryan (owner)** | Demonstrate graphics + systems skill | The site itself is evidence; must look intentional and run smoothly |

Primary device targets: desktop (mouse + scroll wheel) first; tablet/mobile (touch) supported with simplified camera/layout.

---

## 4. Requirements

### 4.1 Functional
- **F1** Landing renders a single full-viewport `<Canvas>` with `ScrollControls` driving a multi-section scene.
- **F2** Sections in order: **Hero** (brand identity + spin logo), **ProjectCollection** (cards laid out by the active lens), **Contact** (social links). When the lens is **tier**, cards group into three depth strata (Flagship/Strong/Notable); when **domain**, they regroup into the canonical domain buckets present among the ~20.
- **F3** A **tier ↔ domain toggle** (DOM control overlaid on the canvas, or in-canvas) sets the active lens in the scene store; the collection re-lays-out with a damped transition. Default lens: **tier**.
- **F4** Camera moves are scroll-driven and frame-damped (no tween library); each section exposes a local 0..1 progress for reveals.
- **F5** Project cards are interactive: hover lifts/scales (damped); click navigates to the detail route.
- **F6** `/projects/:id` resolves a project from the data module and renders an HTML detail layout (title, language chips, tagline, blurb, "why it matters", canonical domain, GitHub button, back link) plus a small tier-tinted 3D accent canvas. Unknown id → redirect to `/`.
- **F7** A loading overlay shows brand mark + progress and clears once the scene is ready (with a guaranteed fallback timeout).
- **F8** Fixed nav: brand monogram (→ `/`), GitHub link, contextual "← All work" on detail pages.

### 4.2 Non-Functional
- **N1 Performance** — Target 60 fps on a 2021+ laptop; transparent/glass layers use cheap materials; no per-frame allocations in `useFrame` (reuse vectors/colors).
- **N2 Accessibility** — All DOM links keyboard-focusable; the tier/domain toggle operable by keyboard; `prefers-reduced-motion` honored in CSS and the camera rig; meaningful `alt`/`aria`.
- **N3 Responsiveness** — Layout and camera adapt below 1024px and 640px; no horizontal overflow.
- **N4 Type safety** — Must satisfy `apps/client/tsconfig.app.json`: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (type-only imports use `import type`), and **`erasableSyntaxOnly`** (no `enum`/runtime `namespace`; use union types + `const` objects).
- **N5 No dead code / stubs** — Every component fully implemented; no placeholder returns (aligns with repo `CLAUDE.md`).
- **N6 Brand fidelity** — Palette from brand assets: violet `#7e14ff` / `#863bff` / `#aa3bff`, lavender `#ede6ff`, cyan `#47bfff`; dark gradient depth `#0b0a14`→`#171526`.

---

## 5. Architecture

### 5.1 Stack
- **Runtime:** React 19 (React Compiler via `@vitejs/plugin-react` + `@rolldown/plugin-babel`), Vite 8, TypeScript ~6 (strict).
- **3D:** `three` 0.184, `@react-three/fiber` 9, `@react-three/drei` 10 (`ScrollControls`, `useScroll`, `Scroll`, `Text`, `Svg`, `useProgress`, `Preload`).
- **Routing:** `react-router-dom` 7 — **`createBrowserRouter` + `RouterProvider`, clean URLs** (host provides SPA history fallback).
- **State:** `zustand` 5 (single scene store, incl. the active lens).
- **Motion:** none added — frame-based `THREE.MathUtils.damp` for 3D; CSS transitions + `IntersectionObserver` for DOM reveals.
- **Available but deferred:** `@react-three/offscreen`, `@react-three/cannon` + `@pmndrs/cannon-worker-api`, `uikit`, `@use-gesture/react`.

**Deliberate choice:** no GSAP/framer-motion — the scroll experience is reproducible with drei `ScrollControls` + `damp`, keeping deps minimal.

### 5.2 Source layout (`apps/client/src/`)
```
main.tsx                 # React root → <App/>
App.tsx                  # createBrowserRouter: Layout > [Landing, ProjectDetail, * → /]
routes/
  Landing.tsx            # full-viewport <Canvas> + ScrollControls
  ProjectDetail.tsx      # /projects/:id — DOM layout + 3D accent
three/
  SceneContent.tsx       # orchestrates sections inside <ScrollControls>
  CameraRig.tsx          # useFrame: damp camera through waypoints + pointer parallax
  LayeredBackdrop.tsx    # signature stacked translucent gradient planes
  GlassLayer.tsx         # reusable single translucent/glass plane primitive
  LogoSpin.tsx           # brand stroke-spin motif (drei <Svg> of the logo)
  Hero.tsx               # name + tagline + LogoSpin
  ProjectCollection.tsx  # lays out cards per active lens (tier | domain), damped re-layout
  ProjectCard.tsx        # one project plane: name, langs, tagline; damped hover
  Contact.tsx            # social links
  ProjectAccent.tsx      # small tier-tinted accent for the detail page
components/
  Layout.tsx             # Loader + Nav + <Outlet/>
  Nav.tsx                # fixed brand nav
  Loader.tsx             # useProgress overlay → sets useScene.ready (+ fallback)
  LensToggle.tsx         # DOM segmented control: "By tier" ↔ "By domain"
stores/
  useScene.ts            # zustand: ready, section, hovered, lens, reducedMotion + setters
hooks/
  useScrollRange.ts      # wraps useScroll().range/offset → per-section [0..1]
  useInViewport.ts       # IntersectionObserver → boolean (detail reveals)
data/
  projects.ts            # typed Project[] (real content from LayeredShowcase.md)
  domains.ts             # canonical Domain union + ordered list/labels + projectsByDomain()
  social.ts              # GitHub, email, profile links
styles/
  theme.css              # CSS brand tokens
  brand.ts               # same brand values for the TSX/WebGL side + tier maps
assets/                  # (public/layerdynamics-logo.svg served for LogoSpin)
```

> **Change vs. the v1 draft:** `TierShowcase.tsx` + `ProjectCarousel.tsx` are merged into a single **`ProjectCollection.tsx`** that renders either grouping from one card set; new `components/LensToggle.tsx` and `data/domains.ts`; the scene store gains `lens`.

### 5.3 Data model (`data/projects.ts`, `data/domains.ts`)
```ts
// projects.ts
export type Tier = 'flagship' | 'strong' | 'notable'         // union — NOT enum (N4)
export interface Project {
  id: string; name: string; tier: Tier; langs: string[]
  tagline: string; blurb: string; why?: string
  url: string; domain: Domain; stars?: number
}

// domains.ts — canonical titles verbatim from LayedIntrests.md
export type Domain =
  | 'Systems Programming & Native Runtimes'
  | 'AI/ML on Apple Silicon'
  | 'AI Agents & Autonomous Systems'
  | '3D Graphics, CAD & Computational Geometry'
  | 'Developer Tooling & CLIs'
  | 'Web Frameworks & Full-Stack'
  | 'Compilers & Language Tooling'
  | 'WebAssembly'
  | 'MCP Protocol & Claude Code Ecosystem'
  | 'Web Scraping & Data Pipelines'
export const domainOrder: Domain[]            // canonical display order
export const projectsByDomain: (d: Domain) => Project[]
```
> **Known correction (apply when code resumes):** the already-written `data/projects.ts` used invented domain strings ("Web Platform & Systems", "CLI & Developer Tooling", …). These must be replaced with the canonical `Domain` values per the §5.4 mapping, and `Project.domain` retyped from `string` to `Domain`.

### 5.4 Canonical domain mapping (the ~20 public projects)

| Project | Tier | Canonical domain |
|---------|------|------------------|
| BrowserX | flagship | Web Frameworks & Full-Stack |
| forge | flagship | Systems Programming & Native Runtimes |
| node-rust-pty | flagship | Systems Programming & Native Runtimes |
| Echelon | flagship | Web Frameworks & Full-Stack |
| smlx | flagship | AI/ML on Apple Silicon |
| stega | strong | Developer Tooling & CLIs |
| rex-orm | strong | Web Frameworks & Full-Stack |
| tgc | strong | Compilers & Language Tooling |
| mdx-to-json | strong | Developer Tooling & CLIs |
| nodepad | strong | Compilers & Language Tooling |
| bb-stream | notable | Systems Programming & Native Runtimes |
| GameWarden | notable | 3D Graphics, CAD & Computational Geometry |
| canto | notable | MCP Protocol & Claude Code Ecosystem † |
| auto_dep | notable | Developer Tooling & CLIs |
| pytui | notable | Developer Tooling & CLIs |
| scriptic | notable | Developer Tooling & CLIs |
| HyperCrawler | notable | Web Scraping & Data Pipelines |
| logly | notable | Developer Tooling & CLIs |
| jknife | notable | Developer Tooling & CLIs ‡ |
| create-electron-wasm | notable | WebAssembly |

**Adjudications (owner: please confirm in §12):**
- **† canto** is dual-listed in `LayedIntrests.md` (domain 3 *AI Agents* and domain 9 *MCP Protocol*). Assigned to **MCP Protocol & Claude Code Ecosystem** (matches its "MCP server" tagline). Consequence: with only the ~20, the *AI Agents & Autonomous Systems* domain has **no** public showcase project and will not appear under the domain lens.
- **‡ jknife** is **not present** in `LayedIntrests.md`. Assigned to **Developer Tooling & CLIs** by nature (JSON toolkit).

Domains absent from the ~20 (won't appear under the domain lens): *AI Agents & Autonomous Systems* (see †), *Hardware/Embedded/DIY*, *Security & Compliance*, *Web Scraping* has exactly one (HyperCrawler).

### 5.5 Scene, camera & lens
- `Landing` mounts `<Canvas>` (clear color `--bg-0`) → `<ScrollControls pages≈5 damping≈0.3>` → `<Scroll>` (3D `SceneContent`) and `<Scroll html>` (section labels, `LensToggle`, scroll hint) → `<Preload all/>`.
- `CameraRig` reads `useScroll().offset` each frame and damps camera position/rotation between section waypoints; subtle pointer parallax; writes active `section` into `useScene`. With `reducedMotion`, it snaps to targets and disables idle motion.
- `ProjectCollection` reads `useScene.lens`. Each card computes a **target transform from its group index within the active grouping** (tier bucket or domain bucket) and `damp`s toward it, so switching lenses animates the same cards into a new arrangement (no unmount/remount).
- `useScrollRange(start, length)` returns local 0..1 for a section (the mohitvirli `data.range` idiom).

### 5.6 State (`stores/useScene.ts`)
`{ ready, section, hovered, lens, reducedMotion }` with idempotent setters. `lens: 'tier' | 'domain'` (default `'tier'`), set by `LensToggle`. `CameraRig` sets `section`; `ProjectCard` sets `hovered`; `Loader`/scene set `ready`.

### 5.7 Routing & detail page
- `createBrowserRouter` with a `Layout` root (`Loader` + `Nav` + `<Outlet/>`), `index` → `Landing`, `projects/:id` → `ProjectDetail`, `*` → `<Navigate to="/" replace/>`. Clean URLs; host must serve `index.html` for unknown paths (Vercel/Netlify/Railway default).
- `ProjectDetail` looks up `useParams().id` in `data/projects.ts`; miss → redirect. Renders the HTML detail layout (reveals via `useInViewport` + `.reveal[data-visible]`), shows the canonical domain, and a small `<Canvas>` hosting `ProjectAccent` tinted by `tier` (`brand.ts` `tierColor`).

---

## 6. Visual & Interaction Design

- **Depth field:** `LayeredBackdrop` renders a stack of large translucent gradient planes at varied z; parallax responds to scroll + pointer — the persistent brand backdrop.
- **Glass primitive:** `GlassLayer` is the reused translucent plane (transparent, `depthWrite` off, fresnel edge); tinted instances build collection group backings and the `ProjectAccent`.
- **Logo motif:** `LogoSpin` loads `public/layerdynamics-logo.svg` (the brand's nested-diamond *stack* — itself a "layers" glyph) via drei `<Svg>`, extruded and slowly rotating; the Hero centerpiece.
- **Collection & lens:** cards sit on a cylinder/arc (mohitvirli math: angle per index → x/z + facing rotation). Cards are grouped by the active lens; group headers (tier name, or domain title) render as drei `<Text>`. The **`LensToggle`** segmented control ("By tier" / "By domain") flips `useScene.lens`; cards `damp` from their old transform to the new grouping's transform.
- **Camera path:** Hero (front) → descend Y into the collection → settle at Contact.
- **Card hover:** damps scale/z up, reveals tagline; click → route.
- **Palette & tokens:** defined once in `styles/theme.css` (CSS), mirrored in `styles/brand.ts` (TSX). Dark, violet-forward, cyan accent.

---

## 7. Reference Patterns Adopted (traceability)

| Pattern | Source file (reference repo) | Where used here |
|---------|------------------------------|-----------------|
| `ScrollControls` + `useScroll().range` scroll mapping | mohitvirli `app/components/common/CanvasLoader.tsx`, `ScrollWrapper.tsx` | `Landing.tsx`, `CameraRig.tsx`, `useScrollRange.ts` |
| `THREE.MathUtils.damp` camera/transform easing | mohitvirli `ScrollWrapper.tsx`, `ProjectTile.tsx` | `CameraRig.tsx`, `ProjectCard.tsx`, `ProjectCollection.tsx` |
| zustand store for scene/lens state | mohitvirli `app/stores/*` | `stores/useScene.ts` |
| Cylindrical carousel layout | mohitvirli `projects/ProjectsCarousel.tsx` | `ProjectCollection.tsx` |
| Routed project detail + project-header layout | Hamish `app/layouts/project/`, `routes/projects.*` | `ProjectDetail.tsx` |
| `IntersectionObserver` reveal hook | Hamish `app/hooks/useInViewport.js` | `hooks/useInViewport.ts` |
| Design-token system (CSS custom props) | Hamish `app/components/theme-provider/theme.js` | `styles/theme.css` |
| `useProgress` custom loader | drei (both refs) | `components/Loader.tsx` |

---

## 8. Implementation Plan / Milestones

| # | Milestone | Deliverables | Acceptance |
|---|-----------|--------------|------------|
| **M1** | Deps + wiring | `zustand`, `react-router-dom` added; router in `App.tsx`; `Layout`/`Nav`/`Loader`; brand `theme.css` + `index.css`; logo in `public/` | `pnpm install` clean; app boots to loader + nav |
| **M2** | Data + store + hooks | `data/projects.ts` (all ~20, **canonical `Domain`**), `data/domains.ts`, `data/social.ts`, `stores/useScene.ts` (incl. `lens`), `hooks/*` | S7; data matches `LayeredShowcase.md` + §5.4 |
| **M3** | Brand 3D primitives | `GlassLayer`, `LayeredBackdrop`, `LogoSpin`, `CameraRig` | Hero renders; camera responds to scroll |
| **M4** | Collection + lens | `ProjectCollection`, `ProjectCard`, `LensToggle`, `Contact`, `SceneContent`, `Landing` | S1, S2, S4 |
| **M5** | Detail page | `ProjectDetail`, `ProjectAccent`, `useInViewport` | S2 (route+back), S3 |
| **M6** | Polish + verify | reduced-motion, responsive, a11y; build + lint | S5, S6 |

> **Status:** M1 done (deps installed; router, theme, `Layout`/`Nav`/`Loader`/store written). M2 partially written (`projects.ts`, `social.ts`) but **needs the canonical-domain correction (§5.3/§5.4) and `domains.ts` before it counts as done**. **All further implementation is PAUSED pending approval of this spec.**

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation | Owner |
|------|--------|-----------|-------|
| `useProgress` never completes (procedural scene) → loader stuck | High | Fallback timeout in `Loader` always clears `ready` | impl |
| Many transparent layers tank fps / z-sort artifacts | Med | Cheap materials, `depthWrite:false`, limited layer count, no per-frame allocs (N1) | impl |
| Lens switch causes card unmount/remount jank | Med | Keep one stable card set keyed by `project.id`; only transforms change, `damp`ed | impl |
| Strict TS (`erasableSyntaxOnly`, `verbatimModuleSyntax`, unused checks) breaks build | Med | Union types + `const` maps, `import type`, no unused symbols; `tsc -b` is the gate | impl |
| Clean-URL deep links 404 if host lacks SPA fallback | Med | Confirmed host has history fallback; document the rewrite in deploy notes | Ryan @ deploy |
| `canto`/`jknife` domain adjudications wrong | Low | Flagged in §5.4 for owner confirmation (§12 Q1) | Ryan |

---

## 10. Out of Scope / Future Tracks

Deferred (deps present where noted, not wired this version):
- **Offscreen-worker rendering** (`@react-three/offscreen`) — move the landing Canvas into a Web Worker.
- **Physics** (`@react-three/cannon`) — optional interactive/float sections.
- **In-canvas UI** (`uikit`) — WebGL panels for richer in-scene info / the lens toggle.
- **3D models** (`gltfjsx` → `.glb`) — bespoke per-project models / device mockups.
- **Private projects & full 12-domain map** — surfacing non-public work and the domains absent from the ~20.
- **Reusable package extraction** — promote `GlassLayer`, `LayeredBackdrop`, `LogoSpin`, `useScrollRange`, shaders into the empty `packages/*` once stable.
- **`crates/*` WASM** — separate Rust→WASM track.

---

## 11. Verification

End-to-end, from repo root:
1. `pnpm install` — resolves `zustand`, `react-router-dom`.
2. `pnpm --filter client dev` → open the served URL:
   - Scroll `/` end-to-end; camera descends Hero → collection → Contact (S1).
   - Toggle **By tier ↔ By domain**; cards re-lay-out into the other grouping; all clickable (S4).
   - Hover a card (it lifts), click → `/projects/:id` for that project; "← All work"/back returns (S2).
   - Visit `/projects/does-not-exist` → redirected to `/` (S3).
   - Loader shows brand mark + progress, then clears (F7).
3. `pnpm --filter client build` → **`tsc -b` passes under strict flags** + `vite build` succeeds (S5).
4. `pnpm --filter client lint` → no errors (S5).
5. Manual: enable OS reduced-motion → motion reduced (S6); resize to mobile → usable, no overflow (N3); tab through nav/toggle/detail links → all reachable (N2).
6. Spot-check `data/projects.ts` against `LayeredShowcase.md` (all ~20) and §5.4 (domains) (S7).

---

## 12. Open Questions (with owners)

| # | Question | Owner | Current default |
|---|----------|-------|-----------------|
| Q1 | Confirm the **canto** (→ MCP, leaving AI-Agents domain empty) and **jknife** (→ Developer Tooling) domain adjudications in §5.4 | Ryan | As written in §5.4 |
| Q2 | Contact: surface email (`layerdynamics@proton.me`) **and** GitHub, or GitHub-only? | Ryan | Both (in `data/social.ts`) |
| Q3 | Default landing lens — **tier** or **domain**? | Ryan | tier |
| Q4 | Initialize the empty `packages/*` now for early extraction? | Ryan | No — keep in `apps/client`, extract later (§10) |

*Resolved in discovery (2026-05-30): process = spec-first/paused; host = clean-URL/`createBrowserRouter`; domain grouping = re-bucket the ~20 with a tier↔domain toggle.*

---

*This spec governs the build; step-level execution lives in the approved implementation plan. Update this document (not just the code) if a locked decision in §2/§4/§5/§6 changes. **Implementation is paused until the owner approves this spec.***
