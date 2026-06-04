# M2 — Languages level (3D)

**Goal:** Register a new `'languages'` level under the printer and render the five
brand-colored logo GLBs in a responsive side-by-side row with hover affordance.
Clicking is inert this milestone (nav is wired in M3). Stories for every new component.

**Depends on:** M1. **Blocks:** M3 (onClick target), M5.

## Files

- **New** `apps/client/src/components/scene/Languages/LanguageLogo.tsx`
- **New** `apps/client/src/components/scene/Languages/LanguageLogo.stories.tsx`
- **New** `apps/client/src/components/scene/Languages/LanguagesLevel.tsx`
- **New** `apps/client/src/components/scene/Languages/LanguagesLevel.stories.tsx`
- **New** `apps/client/src/components/scene/Languages/index.ts`
- **Edit** `apps/client/src/stores/useLevels.ts` — `LevelId` union + `LEVELS` entry at index 1
- **Edit** `apps/client/src/components/scene/levels/LevelView.tsx` — `case 'languages'`
- **Edit** `apps/client/src/stores/useLevels.test.ts` — update count/order expectations

## Tasks

1. **`LanguageLogo.tsx`** — one clickable, brand-colored logo. Follow `PrintedTitle`:
   ```ts
   // props: { lang: LanguageDef; position; onSelect?: (id: LanguageId) => void }
   const { scene } = useGLTF(lang.glb)
   // useMemo: scene.clone(true); traverse meshes -> MeshStandardMaterial({
   //   color: langColor[lang.id], emissive: langColor[lang.id],
   //   emissiveIntensity: hover ? 0.5 : 0.2, roughness: 0.4, metalness: 0.1 })
   ```
   - Hover state (`useState`) → brighten `emissiveIntensity` + small scale-up (damped in
     `useFrame` via `THREE.MathUtils.damp`, no spring lib needed; matches "no GSAP" rule).
   - `document.body.style.cursor='pointer'` on hover, restored on out/unmount (copy the
     `PortalShowcase` effect — never leave the cursor stuck).
   - `onClick`: `e.stopPropagation(); onSelect?.(lang.id)`. **No router import here.**
   - A `<Text>` (drei) label under each logo (reuse the project's FONT constants used by
     `PortalShowcase`) showing `lang.label`, sized off the logo world-width for mobile.
   - `useGLTF.preload(lang.glb)` at module scope for each — or preload all in the level.
   - **Lint:** confirm `components/scene/**` is covered by the `react-hooks/immutability`
     + `refs` exemption glob in `eslint.config.js`; if the exemption is `src/three/**`
     only, extend the glob to `components/scene/**` (it already hosts `PrintedTitle`'s
     per-frame mutation, so this should already be handled — verify, don't assume).

2. **`LanguagesLevel.tsx`** — lay out the five logos in a **responsive** row:
   - Read `languageOrder` + `languages` (M1). Render one `LanguageLogo` each.
   - Compute x-positions from viewport aspect (`useThree(s => s.viewport)`): keep the
     **row's total world width ~constant** and let the camera contain-fit it; on portrait,
     wrap to 2 rows (e.g. 3 + 2) or reduce spacing so logos scale up, not crush
     (mirror `OtherWorkLevel`/`responsiveGrid` thinking from the index's mobile rule).
   - Thread an `onSelect` prop down (default no-op in M2; supplied in M3).
   - Add a soft key light if the level needs it (the persistent `LevelScene` lights may
     suffice — check by story render; logos are emissive so likely fine).

3. **`useLevels.ts`** — register the level:
   - `export type LevelId = 'hero' | 'languages' | 'otherWork' | 'hireMe'`
   - Insert into `LEVELS` at **index 1** with contain-fit framing + an accent color, e.g.
     `{ id: 'languages', scrollMode: 'advance', camera: { position: [0,0,10], target: [0,0,0], fov: 44, fitWidth: <rowWidth>, fitHeight: <rowHeight> }, accent: '#654FF0' }`.
     Tune `fitWidth/fitHeight` to the row's measured world extent (set after a first
     render pass; verify on mobile in M5).

4. **`LevelView.tsx`** — add `case 'languages': return <LanguagesLevel />` and import it.

5. **`useLevels.test.ts`** — update: `LEVEL_COUNT === 4`; order is
   `['hero','languages','otherWork','hireMe']`; advancing from index 0 lands on
   `languages`; any hardcoded index expectations bumped. Run and make green.

## Stories (required — CLAUDE.md)

- `LanguageLogo.stories.tsx` — smoke-mount (renders without throwing) under the canvas
  decorator; a **control-driven** story varying `lang` across all five so each GLB +
  color is exercised as a browser test (the Draco/`useGLTF` decoder caveat: follow
  `Ender5Pro.stories.tsx` for the decoder setup so `useGLTF` doesn't suspend forever).
- `LanguagesLevel.stories.tsx` — smoke-mount of the full row; a portrait-viewport story
  (set the SB viewport / canvas size to ~390×844) asserting it renders.

## Acceptance criteria

- The `languages` level renders 5 brand-colored logos in a row; hovering brightens +
  scales one; the row stays framed on desktop and portrait.
- Clicking logs/calls `onSelect` (no navigation yet) — no crash, no router import in Canvas.
- `pnpm --filter client test` (unit + storybook browser) green; `lint` + `tsc` clean.

## Verification

```bash
cd apps/client
pnpm test                 # unit + storybook browser tests incl. new stories
pnpm lint && pnpm exec tsc -b --noEmit
# visual: render the level via the headless rig (see client-redesign-verification-rig)
# at desktop AND 390x844 — confirm 5 logos legible, not crushed.
```
