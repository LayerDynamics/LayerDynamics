# M3 — Canvas → route navigation bridge

**Goal:** Clicking a logo in the `languages` level routes to `/languages/:lang` —
without importing router hooks inside the Canvas. Mirror the established
`usePortalOverlay` store bridge. Add the route (page itself is M4; here it can resolve
to a temporary `<Navigate>`-safe stub only if M4 isn't done yet — but prefer doing M4
right after so the route renders real content).

**Depends on:** M2 (the onClick target), M1. **Blocks:** full click-through (with M4).

## Files

- **New** `apps/client/src/stores/useLanguageNav.ts`
- **New** `apps/client/src/components/LanguageNavBridge.tsx` (DOM, Canvas sibling)
- **New** `apps/client/src/components/LanguageNavBridge.stories.tsx`
- **New** `apps/client/src/stores/useLanguageNav.test.ts`
- **Edit** `apps/client/src/routes/Landing.tsx` — mount `<LanguageNavBridge />`
- **Edit** `apps/client/src/components/scene/Languages/LanguagesLevel.tsx` — pass
  `onSelect={openLanguage}` from the store into the logos
- **Edit** `apps/client/src/App.tsx` — add route `languages/:lang`

## Tasks

1. **`useLanguageNav.ts`** — minimal store, exactly like `usePortalOverlay`:
   ```ts
   interface LanguageNavState {
     pending: LanguageId | null
     open: (id: LanguageId) => void
     consume: () => void          // clears pending after navigation
   }
   ```
   Document at top: "Bridges the in-Canvas logo click to the DOM router. zustand crosses
   the R3F boundary cleanly — no router context inside the Canvas (same rule as
   usePortalOverlay / the project-card onOpen callback)."

2. **`LanguagesLevel.tsx`** — read `const open = useLanguageNav(s => s.open)` and pass
   `onSelect={open}` to each `LanguageLogo`. (The logo still imports no router code.)

3. **`LanguageNavBridge.tsx`** — DOM component, **sibling of the Canvas** in `Landing`
   (owns router hooks). Subscribes to the store and navigates:
   ```ts
   const pending = useLanguageNav(s => s.pending)
   const consume = useLanguageNav(s => s.consume)
   const navigate = useNavigate()
   useEffect(() => {
     if (!pending) return
     navigate(`/languages/${pending}`)
     consume()
   }, [pending, navigate, consume])
   return null
   ```

4. **`Landing.tsx`** — render `<LanguageNavBridge />` alongside `<HireMeOverlay />` /
   `<PortalOverlay />` (the other DOM siblings of the Canvas).

5. **`App.tsx`** — add child route under `/`:
   `{ path: 'languages/:lang', element: <LanguageProjects /> }` (M4 provides the
   component; import it). Unknown `:lang` is handled inside the page via
   `languageById` → `<Navigate to="/" replace />` (same idiom as `ProjectDetail`).

## Stories / tests

- `useLanguageNav.test.ts` (unit): `open('rust')` sets `pending==='rust'`; `consume()`
  clears it; default `pending` is null.
- `LanguageNavBridge.stories.tsx`: a `play()` story wrapping the component in a
  `MemoryRouter`, setting `pending` via the store, and asserting the route changed
  (e.g. render a `useLocation` probe and assert `/languages/rust`). a11y pass (renders
  null, so primarily exercises the effect + router).

## Acceptance criteria

- Clicking a logo navigates to `/languages/<id>`; the store is cleared after (no
  navigation loop). No router import anywhere inside the `<Canvas>` subtree.
- `pnpm --filter client test` green (new unit + story); `lint` + `tsc` clean.

## Verification

```bash
cd apps/client
pnpm test && pnpm lint && pnpm exec tsc -b --noEmit
pnpm dev   # click each logo -> URL becomes /languages/<id>; back button returns to /
```

## Watch-items

- Do the navigation in the **DOM bridge**, never in the logo. Grep to confirm no
  `react-router` import under `components/scene/**`.
- The bridge returns `null` and must be a child of the router (it is — `Landing` is a
  route element), not inside the Canvas.
