# Languages Level — Implementation Plan (Index)

**Date:** 2026-06-04
**Feature:** A new immersive **"Languages"** level inserted directly under the printer
(hero) level. It shows the five extruded tech-logo GLBs (WebAssembly, Python, Rust,
TypeScript, Deno) side by side; clicking a logo routes to a per-language page that
lists a curated set of the owner's GitHub projects written in that language. Every
new component ships a Storybook story.

This is a **milestone implementation plan** — execute the milestone files in order,
one at a time, each independently shippable (tests + stories + lint + typecheck
green before moving on). Mirrors the `portal-00-index` precedent.

---

## Product framing

The landing is a teardown of immersive levels (SPEC-002): the hero **is** the Ender 5
printer "printing" the owner's name. This feature adds a second beat right after it —
a **gallery of the languages the owner builds in**, each rendered as a tangible
brand-colored 3D logo. The logos are not decoration: each is a doorway into the
owner's real work in that language. The page is the curated proof behind the logo.

## Decisions (locked with the user — 2026-06-04)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Per-language data source | **New self-contained curated file** `data/languages.ts` carrying **real live-GitHub metadata** (name, description, url, primaryLang, stars). `projects.ts` is stale/smaller — NOT used here. |
| 2 | Bucketing across overlapping langs | **Multi-tag, can repeat** — a repo may appear under several languages |
| 3 | Per-language page design | **Reuse the `ProjectDetail` DOM-first pattern** — header + logo accent + responsive repo-card grid; **each card links to the GitHub repo** (`target=_blank`), not `/projects/:id` |
| 4 | Logo look in-level | **Brand-color each logo** via material override (GLBs exported neutral precisely so they could be recolored in-scene); hover brightens. Colors in `styles/brand.ts` `langColor` (base + accent). |

**Curation locked (user, 2026-06-04) — exact repo picks from live GitHub:**

| Language (GLB) | base / accent | Repos (ordered) |
|---|---|---|
| Python (`PythonLogo`) | `#3776AB` / `#FFD43B` | auto_dep, scriptic, logly |
| Rust (`RustLogo`) | `#DEA584` / `#F74C00` | mechx, forge, ferrite, Plastiq__, node-rust-pty, GameWarden |
| TypeScript (`TypeScriptLogo`) | `#3178C6` | KiClaude, tgc, mdx-to-json |
| Deno (`DenoLogo`) | `#E5E7EB` | BrowserX, rex-orm |
| WebAssembly (`WebAssemblyLogo`) | `#654FF0` | wasm_os |

**M1 status: DONE** — `data/languages.ts` (self-contained, real metadata), `styles/brand.ts` `langColor`, `data/languages.test.ts` (7 assertions incl. exact-picks guard). `tsc` + `eslint` + unit test green.

**M2 status: DONE** — `components/scene/Languages/{LanguageLogo,LanguagesLevel}.tsx` (+ index, + stories); `'languages'` registered in `useLevels` at index 1 (`fitWidth 10 / fitHeight 3.5`, accent `#654ff0`) + `LevelView` case. Brand-colored material override + hover (damped scale/emissive). Responsive 5-col↔3-col reflow at constant world-width. Fixed every index-shift story regression (LevelIndicator + `Languages` label, Landing, LevelScene, LevelStage, LevelCamera) and `useLevels.test` order/count.

**M3 status: DONE** — `stores/useLanguageNav.ts` (+ test) bridges the in-Canvas click to the DOM; `components/LanguageNavBridge.tsx` (mounted in `Landing`) does the `navigate('/languages/:id')` then `consume()`; `LanguagesLevel.onSelect` defaults to the store's `open`. No router import inside the Canvas. Store test + bridge story green.

**M4 status: DONE** — `routes/LanguageProjects.tsx` (`/languages/:lang`, registered in `App.tsx`) reuses the ProjectDetail pattern: logo accent + responsive `RepoCard` grid from `reposForLanguage`. `components/RepoCard.tsx` links each card to the GitHub repo (`target=_blank`). `.lang*` + `.repo-grid`/`.repo-card*` mobile-first CSS in `App.css` (1→2→3 cols). RepoCard + LanguageProjects stories green.

**M5 status: DONE** — `LevelTransitions` already reads `LEVELS[].accent` (languages curtain = `#654ff0`); all 5 logo GLBs preload. Portrait "high" placement was a story-canvas artifact — confirmed centered on the real full-height Landing route. **Full suite 118/118 (stable ×2), `tsc` + `eslint .` + `pnpm build` all green.** Visually verified (headless rig): the level wide + portrait (indicator "Languages 02/04" + scroll hint correct) and the Rust page (3-col desktop grid + single-col mobile, all 6 real repos, GitHub links, stars).

**FEATURE COMPLETE — all milestones M1–M5 done.**

## Grounding (verified against the code, 2026-06-04)

- **Level registry is data.** `apps/client/src/stores/useLevels.ts` → `LevelId` union +
  `LEVELS: LevelDef[]` is the single source of order + per-level camera framing.
  Current order: `hero(printer) → otherWork → hireMe`. "Under the printer" = insert
  `'languages'` at **index 1**. Adding a level touches three places only: the union,
  the `LEVELS` array, and the `LevelView` switch.
- **Level render switch:** `components/scene/levels/LevelView.tsx` maps `LevelId →`
  component; `LevelStage.tsx` mounts exactly one, keyed by id (true teardown).
- **GLB display convention:** `components/scene/Printer/PrintedTitle.tsx` —
  `useGLTF(url)` → `scene.clone(true)` → traverse meshes and assign a
  `MeshStandardMaterial` → `useGLTF.preload(url)`. The new `LanguageLogo` follows this
  exactly, overriding the neutral `LogoNeutral` material with the per-language brand color.
- **Canvas → route bridge rule:** no router context inside the `<Canvas>`. Cross via a
  zustand store; a DOM sibling of the Canvas does the `navigate()`. Established by
  `stores/usePortalOverlay.ts` + `PortalOverlay` (and named in-code as "the same rule as
  the project-card onOpen callback"). `routes/Landing.tsx` is the DOM host that owns
  router hooks.
- **Project data:** `data/projects.ts` — 26 GH-curated `Project`s with `langs: string[]`,
  helpers `projectById`, `projectsByTier`, `tierTitle`, `tiers`. Real GitHub urls.
- **Detail route pattern:** `routes/ProjectDetail.tsx` (`/projects/:id`) — DOM-first +
  a small `ProjectAccent` Canvas; reveals via `useInViewport`; unknown id → `<Navigate to="/" />`.
  Routes are declared in `App.tsx` (`createBrowserRouter`).
- **Design rules (CLAUDE.md, non-negotiable):** mobile-first (~390×844 portrait), verified
  on a real viewport via the headless rig (not by math); every component ships a colocated
  `*.stories.tsx` that runs as a Vitest browser test; R3F levels frame with
  `fitWidth`/`fitHeight` (contain-fit), never aspect-scaled fov; grids make column count
  responsive to aspect with ~constant world width.

## Curated language → project mapping (real data, M1 seeds this)

Multi-tag; ordered flagship → strong → notable. Source of truth = `data/projects.ts`.

| Language (logo GLB) | Brand color | Curated project ids (ordered) |
|---|---|---|
| **Python** (`PythonLogo.glb`) | `#3776AB` / accent `#FFD43B` | smlx, auto_dep, pytui, scriptic, logly, jknife |
| **Rust** (`RustLogo.glb`) | `#DEA584` (orange `#F74C00`) | browserx, forge, node-rust-pty, tgc, gamewarden |
| **TypeScript** (`TypeScriptLogo.glb`) | `#3178C6` | kiclaude, lore, browserx, echelon, stega, rex-orm, tgc, mdx-to-json, nodepad, steploader, canto, r3f-splashscreen |
| **Deno** (`DenoLogo.glb`) | `#E5E7EB` (off-white) | forge, browserx, echelon, stega, rex-orm |
| **WebAssembly** (`WebAssemblyLogo.glb`) | `#654FF0` | tgc, create-electron-wasm |

Notes: JavaScript-tagged repos with no JS logo fold into **TypeScript** (same ecosystem)
where curated — explicit in the file, editable. WebAssembly is intentionally sparse; the
curated file is the place to grow it. Every id above resolves in `projects.ts` (M1 test
enforces this).

## Milestones

| File | Milestone | Outcome |
|------|-----------|---------|
| `…-m1-data.md` | **M1 — Data + brand colors** | `data/languages.ts` (typed, curated, multi-tag) + per-language brand colors in `styles/brand.ts`; unit test for referential integrity. No UI. |
| `…-m2-level.md` | **M2 — Languages level (3D)** | `LanguageLogo` (brand-colored GLB + hover) + `LanguagesLevel` (responsive row); register `'languages'` in `useLevels` (index 1) + `LevelView`. Smoke + control stories. Click is inert (wired in M3). |
| `…-m3-nav.md` | **M3 — Canvas→route nav bridge** | `stores/useLanguageNav.ts` + a DOM subscriber in `Landing` calling `navigate('/languages/:lang')`; `LanguageLogo` onClick sets pending; route added in `App.tsx`. Bridge test + story. |
| `…-m4-page.md` | **M4 — Per-language page** | `routes/LanguageProjects.tsx` (`/languages/:lang`) reusing the detail pattern + a reusable `ProjectCard` DOM component + responsive grid CSS. play() + a11y stories. Mobile verified. |
| `…-m5-integration.md` | **M5 — Integration + verification** | `LevelIndicator`/`LevelTransitions` accommodate the new level; GLB preloads; full mobile (390×844) + desktop render verification; lint + typecheck + `pnpm test` green end-to-end. |

## Out of scope

- Live GitHub API fetching (decision #1 chose a curated static file).
- Re-exporting/re-coloring the GLBs (recolor happens at runtime via material override).
- New languages beyond the five exported logos.
- Changing the existing hero/otherWork/hireMe levels beyond what registering a new level requires.

## Top risks / watch-items

1. **Cross-Canvas navigation.** Do not import `useNavigate` inside the Canvas subtree.
   Use the `useLanguageNav` store + a `Landing` DOM effect (M3). Mirror `usePortalOverlay`.
2. **Mobile framing of 5 side-by-side logos.** Use `fitWidth`/`fitHeight` in the level's
   `LEVELS` entry and make the row's world layout responsive (wrap/scale to a ~constant
   world width on portrait) so logos scale up instead of crushing. Verify at 390×844.
3. **Inserting a level shifts indices.** `LevelIndicator`, `LevelTransitions`, and
   `useLevels.test.ts` reference `LEVEL_COUNT`/order — update expectations (M2/M5).
4. **GLB material override + lint.** Per-frame three mutation lives under `src/three/**`
   exemption; these components live under `components/scene/**` — confirm the eslint glob
   covers them (see `eslint.config.js`); follow `PrintedTitle` which already passes.
5. **Logo neutral material name.** Override targets every mesh's material regardless of
   name (traverse + assign), so it's robust to the `LogoNeutral` export.

## Definition of done (whole feature)

- New `languages` level live at index 1; five brand-colored logos render and are hover-affordant.
- Clicking a logo routes to `/languages/:lang` showing the curated, real project cards,
  each linking to `/projects/:id`.
- Every new component has a colocated story; `pnpm --filter client test`, `lint`, and
  `build` (tsc) all pass with zero regressions.
- Verified legible + usable at **390×844 portrait** and a desktop width via the headless rig.
