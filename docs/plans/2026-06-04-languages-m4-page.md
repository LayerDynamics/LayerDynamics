# M4 — Per-language page

**Goal:** `/languages/:lang` renders a DOM-first page (the `ProjectDetail` pattern):
a language header + the logo's 3D accent, then a responsive grid of repo cards for
that language's curated list (from `data/languages.ts`), **each card linking to the
GitHub repo** (`target=_blank`, not `/projects/:id`). Mobile-verified.

> Card model uses `LangRepo` from `data/languages.ts` (real GH metadata) via
> `reposForLanguage(id)`. Do NOT use `data/projects.ts`/`projectById` here.

**Depends on:** M1 (data), M3 (route registered). **Blocks:** M5.

## Files

- **New** `apps/client/src/routes/LanguageProjects.tsx`
- **New** `apps/client/src/routes/LanguageProjects.stories.tsx`
- **New** `apps/client/src/components/RepoCard.tsx` (reusable DOM card for a `LangRepo`)
- **New** `apps/client/src/components/RepoCard.stories.tsx`
- **Edit** `apps/client/src/App.css` — `.lang*` page styles + `.repo-card*` grid (reuse
  `.detail`/`.btn`/`.reveal` tokens already present)

## Tasks

1. **`RepoCard.tsx`** — presentational DOM card for one `LangRepo`:
   - Props: `{ repo: LangRepo }`. Renders `name`, `description`, a `primaryLang` chip
     (reuse `.detail__lang` styling), and `stars` (`★ n`, only when > 0). The whole card
     is an `<a href={repo.url} target="_blank" rel="noreferrer">` — GitHub is the target.
   - Accessible: single link, accessible name = repo name; `aria-label` = name +
     "on GitHub". Keyboard-focusable (it's an `<a>`); external-link affordance (e.g. ↗).

2. **`LanguageProjects.tsx`** — routed page, mirroring `ProjectDetail`:
   - `const { lang } = useParams(); const def = languageById(lang)` →
     if `!def` return `<Navigate to="/" replace />` (same guard as ProjectDetail).
   - `const items = reposForLanguage(def.id)` (M1 helper; real, ordered).
   - Header: language `label` + `blurb`; a `.lang__accent` `<Canvas>` rendering the
     **brand-colored logo GLB** (reuse `LanguageLogo` in a static, non-interactive mode,
     or a thin `LogoAccent` wrapper) — matches `ProjectDetail`'s small accent Canvas.
   - Body: a responsive **grid** of `ProjectCard` (CSS grid, `auto-fill minmax(…)`),
     reveal-on-scroll via `useInViewport` (same hook ProjectDetail uses).
   - Footer actions: `<Link className="btn btn--ghost" to="/">← Back</Link>`.
   - Empty-state guard: if `items.length === 0`, show a real message
     ("More <label> work coming soon") — not a blank page. (Only WASM is near-sparse;
     curated to ≥2, but keep the guard honest.)

3. **`App.css`** — add page + card styles. **Mobile-first**: single-column grid on
   narrow viewports, multi-column from a min-width; cards never overflow 390px; tap
   targets ≥44px. Reuse existing color tokens / `.detail` spacing for cohesion.

## Stories (required)

- `RepoCard.stories.tsx` — `play()` story: renders a real `LangRepo` (import one from
  `data/languages.ts`), asserts the link `href` is the `https://github.com/LayerDynamics/<name>`
  url with `target=_blank` and the name/description are in the DOM; a11y check (single
  accessible link). No router needed (plain `<a>`).
- `LanguageProjects.stories.tsx` — `play()` story under `MemoryRouter` with
  `initialEntries={['/languages/rust']}` and a `:lang` route: asserts the header label
  "Rust" and that the curated cards render with correct count
  (`reposForLanguage('rust').length` === 6) and link to the GitHub repos. Add a portrait
  (~390px) variant. a11y pass. (The accent Canvas uses the same decoder setup as the
  other GLB stories — follow `Ender5Pro.stories.tsx`.)

## Acceptance criteria

- `/languages/python|rust|typescript|deno|webassembly` each render the real curated
  cards (counts: 3 / 6 / 3 / 2 / 1), every card links to its GitHub repo (`target=_blank`).
- Unknown `:lang` redirects home.
- Page is legible + usable at 390×844 (single column) and desktop (multi-column).
- `pnpm --filter client test` green (new stories run as browser tests); `lint` + `tsc` clean.

## Verification

```bash
cd apps/client
pnpm test && pnpm lint && pnpm exec tsc -b --noEmit
pnpm dev   # visit each /languages/<id>; click a card -> /projects/:id; back works
# headless rig: screenshot /languages/rust at 390x844 AND desktop -> confirm grid/cards.
```
