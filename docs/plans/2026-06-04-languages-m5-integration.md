# M5 — Integration + verification

**Goal:** Make the new level a first-class citizen of the orchestrator (indicator,
transitions, preloads), then prove the whole flow on real mobile + desktop viewports
with all checks green. No new features — this is wiring + verification.

**Depends on:** M2, M3, M4.

## Files (edits)

- `apps/client/src/components/LevelIndicator.tsx` (+ `.stories.tsx`) — reflect 4 levels
- `apps/client/src/components/LevelTransitions.tsx` — uses per-level `accent` from
  `LEVELS`; confirm the `languages` accent reads through (likely no code change, just verify)
- `apps/client/src/components/scene/Languages/LanguagesLevel.tsx` — finalize
  `useGLTF.preload` for all 5 logos; tune `fitWidth/fitHeight` in `useLevels.ts` from the
  measured row extent
- `apps/client/src/routes/Landing.tsx` — ensure `<Preload all />` covers the new GLBs (it
  preloads on first Canvas; the per-module `useGLTF.preload` is the reliable path)
- Any snapshot/count test referencing level order (`useLevels.test.ts`, indicator stories)

## Tasks

1. **LevelIndicator** — if it renders one marker per level or a label, confirm it now
   shows 4 and the `languages` position is correct; update its story expectations.
2. **LevelTransitions** — entering `languages` plays its accent (`#654FF0` or chosen).
   Verify the curtain accent switches; adjust the `accent` value for aesthetics if needed.
3. **Preloading** — ensure all five logo GLBs are preloaded (`useGLTF.preload` per logo
   module) so entering the level doesn't pop; confirm no Suspense flash in `pnpm dev`.
4. **Camera framing tune** — with the level live, set `fitWidth/fitHeight` so all five
   logos + labels are fully on-screen and large on **390×844 portrait** and desktop.
   Don't scale fov by aspect (contain-fit only).
5. **Full regression** — run the whole suite; fix any index-shift fallout in other tests.

## Acceptance criteria (feature DoD)

- Scroll order: `hero(printer) → languages → otherWork → hireMe`; indicator + transitions
  correct for all four.
- Five brand-colored logos render, hover-affordant, framed on desktop **and** portrait.
- Clicking a logo → `/languages/:lang` → curated real cards → `/projects/:id`. Back nav works.
- `pnpm --filter client test` (unit + storybook browser), `lint`, and `build` (tsc + vite)
  all pass with **zero regressions**.
- Headless-rig screenshots at **390×844** and a desktop width confirm legibility of the
  level and at least one `/languages/:lang` page (judge mobile by render, not math).

## Verification

```bash
cd apps/client
pnpm test
pnpm lint
pnpm build                 # tsc -b && vite build
# headless rig (client-redesign-verification-rig): capture
#   1) the languages level   2) /languages/rust
# at 390x844 AND ~1440x900; eyeball logos/cards.
```

## Deploy reminder

These are client-only changes (new assets already shipped). After merge, the Railway
service that serves `apps/client` must be **rebuilt/redeployed** to pick up the new route,
components, and the GLBs under `public/assets/objects/` — hot-reload does not cover a
deployed build (see railway-deploy memory).
