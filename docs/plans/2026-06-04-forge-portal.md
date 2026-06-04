# Forge Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use lore:execute to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** Add a second live portal — **Forge** (`https://forge-deno.com`) — beside the existing WASM_OS portal in the Other Work level, mirroring its registration shape and rendering both cards responsively (side-by-side on desktop, stacked on mobile).

**Architecture:** A portal is registered in two places: the provider allowlist (`packages/portal/ssr/lib/AppPortal/AppPortalConfig.ts` — the security source of truth: origin + serveStrategy + sandbox) and the client UI catalog (`packages/portal/src/data/PortalData.ts` — label/kind/presenter/blurb/repoUrl). `forge-deno.com` is a GitHub Pages site that sets **no X-Frame-Options and no CSP** (verified: `server: GitHub.com`, headers absent), so it embeds via `serveStrategy: 'direct'` at its own origin — identical to WASM_OS. The scene side (`OtherWorkLevel`) currently renders a single env-driven `<PortalShowcase />`; it becomes a two-card, aspect-responsive layout passing explicit `app`/`position`/`size` props.

**Tech Stack:** TypeScript ~6, React 19 + React Compiler, React Three Fiber 9 / drei, zustand 5, Vitest 4 (node `unit` + browser `storybook` projects), Storybook 10. Provider = Fastify (deployed as a separate Railway service).

**Practices:** TDD (failing test first, then implementation) · Typed-first (honor `AppPortalConfigEntry` / `PortalDataEntry` from `packages/portal/shared/contract.ts`) · **Mobile-verify gate** (CLAUDE.md non-negotiable: block "done" until rendered headless at ~390×844 **and** desktop and visually confirmed).

**Required skills:** none (no plugin/MCP/hook/agent/SDK surface).

---

## Verified facts (do not re-derive)

- `curl -I https://forge-deno.com/` → `HTTP/2 200`, `server: GitHub.com`, **no** `x-frame-options`, **no** `content-security-policy`. → framing-permissive → `serveStrategy: 'direct'`.
- Page `<title>`: "Forge - Build Desktop Apps with TypeScript"; footer repo: `github.com/LayerDynamics/forge`.
- `selectPresenter.ts` branches on `transport`/`serveStrategy`, **not** `kind` → `kind: 'static'` is the honest label and changes no runtime path. (`grep "\.kind" packages/portal/src` returns nothing.)
- **No client-side CSP exists** (`apps/client/index.html`, `vite.config.ts`, Railway config all clean) → no `frame-src` allowlist to update.
- Sandbox union in `contract.ts` does **not** include `allow-popups-to-escape-sandbox` — do not use it. Use only `allow-scripts | allow-forms | allow-popups | allow-modals | allow-pointer-lock | allow-downloads | allow-same-origin`.
- `otherWork` level framing: `fitWidth: 12.6, fitHeight: 9.5` (`useLevels.ts:67`). Two `[4, 2.6]` cards + gap (~9 wide) fit landscape; portrait must stack.

**Card content (from Phase 2):**
- `repoUrl`: `https://github.com/LayerDynamics/forge`
- `description`: `Forge is an Electron-like desktop application framework using Rust and Deno. Apps are 100% TypeScript/JavaScript - no per-app Rust required. The runtime provides native system access through a secure, capability-based API.`

---

## Task 1: Register Forge in the provider allowlist (typed-first + TDD)

**Files:**
- Modify: `packages/portal/ssr/lib/AppPortal/AppPortalConfig.ts` (append to `REGISTERED_APPS`)
- Test: `packages/portal/ssr/lib/AppPortal/AppPortalConfig.forge.unit.test.ts` (create)
- Reference: negotiate path is `packages/portal/ssr/lib/Portal/PortalAppConnector.ts:19-24` (`case 'direct'` → `url: app.origin`)

**Step 1: Write the failing test**

```ts
// packages/portal/ssr/lib/AppPortal/AppPortalConfig.forge.unit.test.ts
import { describe, it, expect } from 'vitest'
import { getApp, isRegistered } from './AppPortalConfig'

describe('forge registration', () => {
  it('is allowlisted as a direct-embed static app at its own origin', () => {
    expect(isRegistered('forge')).toBe(true)
    const app = getApp('forge')!
    expect(app.origin).toBe('https://forge-deno.com')
    expect(app.serveStrategy).toBe('direct')
    expect(app.kind).toBe('static')
    expect(app.preferredPresenter).toBe('dom-window')
    // Tight sandbox — a static marketing/docs site, not an OS.
    expect(app.sandbox).toEqual(['allow-scripts', 'allow-popups', 'allow-same-origin'])
    expect(app.sandbox).not.toContain('allow-pointer-lock')
    expect(app.staticDir).toBeUndefined() // direct embed: not provider-served
  })
})
```

**Step 2: Run to verify it fails**
`pnpm --filter @layerdynamics/portal test:unit AppPortalConfig.forge` → Expected: FAIL (`forge` not registered).
> If the package test script name differs, use `cd packages/portal && pnpm vitest run AppPortalConfig.forge`. Confirm the exact script from `packages/portal/package.json` before running.

**Step 3: Write minimal implementation** — append this entry to `REGISTERED_APPS` (after the `wasmos` object, before `demo-static`):

```ts
  {
    // Forge — owner-built static site on GitHub Pages (sets no X-Frame-Options/CSP,
    // verified framing-permissive). Embedded directly at its own origin: a path-prefix
    // proxy would break GitHub Pages' absolute asset paths. Sandbox is tight — it is a
    // static marketing/docs site, so only allow-scripts (its JS), allow-popups (external
    // links → new tab), and allow-same-origin (its own origin for any storage).
    id: 'forge',
    label: 'Forge',
    kind: 'static',
    origin: 'https://forge-deno.com',
    serveStrategy: 'direct',
    preferredPresenter: 'dom-window',
    sandbox: ['allow-scripts', 'allow-popups', 'allow-same-origin'],
    defaultSize: [4, 2.6],
  },
```

**Step 4: Run to verify it passes**
`pnpm --filter @layerdynamics/portal test:unit AppPortalConfig.forge` → Expected: PASS.

**Step 5: Commit**
`git add packages/portal/ssr/lib/AppPortal/AppPortalConfig.ts packages/portal/ssr/lib/AppPortal/AppPortalConfig.forge.unit.test.ts && git commit -m "feat(portal): register forge-deno as a direct-embed portal"`

---

## Task 2: Add Forge to the client UI catalog (typed-first + TDD)

**Files:**
- Modify: `packages/portal/src/data/PortalData.ts` (append to `PORTAL_DATA`)
- Test: `packages/portal/src/data/PortalData.forge.unit.test.ts` (create)

**Step 1: Write the failing test**

```ts
// packages/portal/src/data/PortalData.forge.unit.test.ts
import { describe, it, expect } from 'vitest'
import { getPortalData } from './PortalData'

describe('forge portal catalog entry', () => {
  it('mirrors the provider id with card chrome (blurb + repo)', () => {
    const e = getPortalData('forge')!
    expect(e.label).toBe('Forge')
    expect(e.kind).toBe('static')
    expect(e.preferredPresenter).toBe('dom-window')
    expect(e.defaultSize).toEqual([4, 2.6])
    expect(e.repoUrl).toBe('https://github.com/LayerDynamics/forge')
    expect(e.description).toMatch(/Electron-like desktop application framework/)
  })
})
```

**Step 2: Run to verify it fails**
`pnpm --filter @layerdynamics/portal test:unit PortalData.forge` → Expected: FAIL.

**Step 3: Write minimal implementation** — insert into `PORTAL_DATA` (after the `wasmos` entry, before `demo-static`):

```ts
  {
    id: 'forge',
    label: 'Forge',
    kind: 'static',
    preferredPresenter: 'dom-window',
    defaultSize: [4, 2.6],
    description:
      'Forge is an Electron-like desktop application framework using Rust and Deno. Apps are 100% TypeScript/JavaScript - no per-app Rust required. The runtime provides native system access through a secure, capability-based API.',
    repoUrl: 'https://github.com/LayerDynamics/forge',
  },
```

**Step 4: Run to verify it passes**
`pnpm --filter @layerdynamics/portal test:unit PortalData.forge` → Expected: PASS.

**Step 5: Commit**
`git add packages/portal/src/data/PortalData.ts packages/portal/src/data/PortalData.forge.unit.test.ts && git commit -m "feat(portal): add forge to the client portal catalog"`

---

## Task 3: Responsive two-portal layout in OtherWorkLevel (TDD via story, mobile-first)

The level renders one env-driven `<PortalShowcase />`. Replace with two explicitly-keyed cards laid out by viewport aspect: **side-by-side in landscape, stacked in portrait.** Provider origin still defaults from `VITE_PORTAL_ORIGIN` (PortalShowcase's `ENV_ORIGIN`), so only `app`/`position`/`size` are passed.

**Files:**
- Create: `apps/client/src/components/scene/PortalShowcase/portalLayout.ts` (pure, unit-testable)
- Create: `apps/client/src/components/scene/PortalShowcase/portalLayout.unit.test.ts`
- Modify: `apps/client/src/components/scene/levels/OtherWorkLevel.tsx`

**Step 1: Write the failing test** (pure layout math — no R3F needed)

```ts
// apps/client/src/components/scene/PortalShowcase/portalLayout.unit.test.ts
import { describe, it, expect } from 'vitest'
import { portalLayout } from './portalLayout'

describe('portalLayout', () => {
  it('places two cards side-by-side in landscape (aspect >= 1)', () => {
    const l = portalLayout(2, 16 / 9)
    expect(l).toHaveLength(2)
    expect(l[0].position[1]).toBeCloseTo(l[1].position[1]) // same row (equal y)
    expect(l[0].position[0]).toBeLessThan(l[1].position[0]) // distinct columns
    expect(l[0].size[0]).toBeGreaterThan(0)
  })
  it('stacks two cards vertically in portrait (aspect < 1)', () => {
    const l = portalLayout(2, 390 / 844)
    expect(l[0].position[0]).toBeCloseTo(l[1].position[0]) // same column (equal x)
    expect(l[0].position[1]).toBeGreaterThan(l[1].position[1]) // distinct rows
  })
  it('keeps stacked content within the otherWork frame (fitWidth 12.6, fitHeight 9.5)', () => {
    const l = portalLayout(2, 390 / 844)
    for (const c of l) {
      expect(Math.abs(c.position[0]) + c.size[0] / 2).toBeLessThanOrEqual(12.6 / 2)
      expect(Math.abs(c.position[1]) + c.size[1] / 2).toBeLessThanOrEqual(9.5 / 2)
    }
  })
})
```

**Step 2: Run to verify it fails**
`pnpm --filter client test:unit portalLayout` → Expected: FAIL (module missing).

**Step 3: Write minimal implementation**

```ts
// apps/client/src/components/scene/PortalShowcase/portalLayout.ts

/** One placed portal card: world-space center + [w,h] size. */
export interface PortalSlot {
  position: [number, number, number]
  size: [number, number]
}

// otherWork camera frames a 12.6 × 9.5 world box (useLevels.ts). Keep cards inside it.
const FRAME_W = 12.6
const FRAME_H = 9.5
const Z = 0.6 // matches PortalShowcase default depth

/**
 * Lay out `n` portal cards responsively. Landscape (aspect >= 1) → a single row,
 * cards sized to share the frame width with a gap. Portrait (aspect < 1) → a single
 * column, cards sized to share the frame height. Cards keep the WASM_OS aspect
 * (~4:2.6) and never exceed the frame, so the contain-fit LevelCamera holds and
 * cards scale UP on a phone instead of being crushed.
 */
export function portalLayout(n: number, aspect: number): PortalSlot[] {
  const portrait = aspect < 1
  const gap = 0.6
  const cardAspect = 4 / 2.6
  const slots: PortalSlot[] = []

  if (portrait) {
    // Stack: divide frame height; cap card width to ~88% of frame width.
    const h = Math.min((FRAME_H - gap * (n - 1)) / n, (FRAME_W * 0.88) / cardAspect)
    const w = h * cardAspect
    const total = h * n + gap * (n - 1)
    for (let i = 0; i < n; i++) {
      const y = total / 2 - h / 2 - i * (h + gap)
      slots.push({ position: [0, y, Z], size: [w, h] })
    }
  } else {
    // Row: divide frame width; cap card height to ~92% of frame height.
    const w = Math.min((FRAME_W - gap * (n - 1)) / n, FRAME_H * 0.92 * cardAspect)
    const h = w / cardAspect
    const total = w * n + gap * (n - 1)
    for (let i = 0; i < n; i++) {
      const x = -total / 2 + w / 2 + i * (w + gap)
      slots.push({ position: [x, 0, Z], size: [w, h] })
    }
  }
  return slots
}
```

**Step 4: Run to verify it passes**
`pnpm --filter client test:unit portalLayout` → Expected: PASS.

**Step 5: Wire it into the level** — replace the body of `OtherWorkLevel.tsx`:

```tsx
import { useThree } from '@react-three/fiber'
import { PortalShowcase } from '../PortalShowcase/PortalShowcase'
import { portalLayout } from '../PortalShowcase/portalLayout'

/** Registered apps shown in this level, left→right / top→bottom. */
const APPS = ['wasmos', 'forge'] as const

/**
 * Other Work level: live windowed apps (portals). Renders one PortalShowcase per
 * registered app, laid out responsively (side-by-side on desktop, stacked on a
 * phone) by viewport aspect. Provider origin comes from VITE_PORTAL_ORIGIN; the
 * cards are inert until it is set. More portals are added by extending APPS.
 */
export default function OtherWorkLevel() {
  const aspect = useThree((s) => s.viewport.aspect)
  const slots = portalLayout(APPS.length, aspect)
  return (
    <>
      {APPS.map((app, i) => (
        <PortalShowcase key={app} app={app} position={slots[i].position} size={slots[i].size} />
      ))}
    </>
  )
}
```

> NOTE on `viewport.aspect`: confirm it recomputes on resize for this R3F version; if a story shows a stale layout after a viewport change, read aspect from `useThree((s) => s.size)` (`size.width / size.height`) instead. Decide by observing the Task 5 renders, not by guessing.

**Step 6: Run unit + typecheck**
`pnpm --filter client test:unit portalLayout && pnpm --filter client build` → Expected: PASS (tsc clean).

**Step 7: Commit**
`git add apps/client/src/components/scene/PortalShowcase/portalLayout.ts apps/client/src/components/scene/PortalShowcase/portalLayout.unit.test.ts apps/client/src/components/scene/levels/OtherWorkLevel.tsx && git commit -m "feat(client): responsive two-portal layout in OtherWorkLevel"`

---

## Task 4: Dedicated story/test pass (Phase-2 inclusion)

Cover the new Forge card and both level orientations as real-browser Storybook tests (the Vitest `storybook` project runs these in Chromium).

**Files:**
- Modify: `apps/client/src/components/scene/PortalShowcase/PortalShowcase.stories.tsx` (add a `Forge` story)
- Modify: `apps/client/src/components/scene/levels/OtherWorkLevel.stories.tsx` (add `Landscape` + `Portrait` stories)
- Reference existing patterns: `PortalShowcase.stories.tsx:36` (`Wasmos`), `OtherWorkLevel.stories.tsx` (`withCanvas`/`withLevels` decorators, `sceneSmokeTest`).

**Step 1: Add the Forge showcase story** (mirror `Wasmos`, passing `app: 'forge'` and a `providerOrigin` so the card is not inert):

```tsx
/** The forge portal — static GitHub Pages site embedded direct at its own origin. */
export const Forge: Story = {
  args: { app: 'forge', providerOrigin: 'http://127.0.0.1:1', size: [4, 2.6] },
  play: sceneSmokeTest, // import alongside the existing helpers if not already present
}
```
> Match the existing `Wasmos` story's exact arg/`play` shape in that file — if it passes `providerOrigin` differently or omits `play`, copy that form. Do not invent a new convention.

**Step 2: Add level orientation stories** — drive aspect via the `canvas` decorator’s size/camera params used elsewhere in the repo. In `OtherWorkLevel.stories.tsx`, add two named stories that render at a wide and a tall viewport so both layout branches execute:

```tsx
export const Landscape: Story = {
  parameters: { canvas: { camera: [0, 0, 12], size: { width: 1280, height: 720 } } },
  play: sceneSmokeTest,
}
export const Portrait: Story = {
  parameters: { canvas: { camera: [0, 0, 12], size: { width: 390, height: 844 } } },
  play: sceneSmokeTest,
}
```
> VERIFY the `canvas` parameter supports a `size` key in `.storybook/decorators` (`withCanvas`). Read that decorator first; if it does not accept `size`, set the viewport via the decorator's documented mechanism (e.g. a wrapping fixed-size div) instead. Do not assume the key exists.

**Step 3: Run the story tests**
`pnpm --filter client test:storybook` → Expected: PASS (smoke-mount: renders without throwing for Forge, Landscape, Portrait).

**Step 4: Commit**
`git add apps/client/src/components/scene/PortalShowcase/PortalShowcase.stories.tsx apps/client/src/components/scene/levels/OtherWorkLevel.stories.tsx && git commit -m "test(client): forge card + portrait/landscape OtherWorkLevel stories"`

---

## Task 5: Mobile-verify gate (CLAUDE.md non-negotiable — blocks "done")

Render the real level headless at **both** a phone portrait and a desktop viewport and confirm **both** portals are present, legible, and non-overlapping. Math is not sufficient — observe pixels.

**Files:** none committed (verification artifacts only). Use the existing headless rig (see memory: "Client redesign verification rig" — headless Chrome + CDP) or the portal package's Playwright config (`packages/portal/playwright.config.ts`) as the driver.

**Steps:**
1. Start the client with a provider origin set so the cards render:
   `cd apps/client && VITE_PORTAL_ORIGIN=https://<portal-provider-host> pnpm dev` (use the live provider host, or the local provider from `packages/portal` — `pnpm --filter @layerdynamics/portal dev` — if testing the env wiring offline).
2. Navigate to the Other Work level and capture two screenshots: **390×844 portrait** and a **desktop** width (e.g. 1440×900).
3. **Pass criteria (all required):**
   - Both "WASM_OS" and "Forge" cards are visible in each screenshot.
   - Portrait: cards are **stacked** (one above the other), each large enough to read its label + "OPEN ↗"; no horizontal crushing.
   - Desktop: cards are **side-by-side**, not overlapping, both within frame.
   - Clicking the Forge card opens `PortalOverlay` titled "Forge" with a working "View repo ↗" link and the `https://forge-deno.com` iframe loading (status 200, content visible). The WASM_OS card still opens its own overlay.
4. If any criterion fails, fix the layout (`portalLayout.ts`) or the aspect source (Task 3 NOTE) and re-capture. Do **not** proceed until both viewports pass.
5. Record the two screenshots' observations in the final summary (do not claim "looks fine" — state what you saw).

---

## Task 6: Full verification, provider redeploy, finalize

**Steps:**
1. **Full client suite:** `pnpm --filter client test` → Expected: PASS (unit + storybook, zero regressions).
2. **Provider suite:** `pnpm --filter @layerdynamics/portal test` → Expected: PASS.
3. **Lint + typecheck:** `pnpm --filter client lint && pnpm --filter client build` and `pnpm --filter @layerdynamics/portal lint` → Expected: clean.
4. **PROVIDER REDEPLOY (required — client change alone won't make `negotiate('forge')` succeed):** `REGISTERED_APPS` lives in the separately-deployed **portal-provider Railway service**. After merging, redeploy that service so the allowlist includes `forge`. Until then, negotiate returns `null` for `forge` in production and the overlay shows the error state. Remind the user to redeploy (see memory: "Discord inquiry proxy" / "Railway deploy" for the service + `railway.toml`-override-Dockerfile gotcha).
5. **Confirm client env:** the deployed client needs `VITE_PORTAL_ORIGIN` set to the provider host (already required for WASM_OS); no new client env var is introduced.
6. **Final commit (if any uncommitted verification fixes remain):**
   `git add -A && git commit -m "chore(portal): finalize forge portal"` (only if Task 5 produced fixes).

**Done means:** Tasks 1–6 complete, all suites green, both viewports visually verified (Task 5), and the user reminded to redeploy the portal-provider service.

---

## Out of scope (note as TODO if encountered, do not do)

- Converting `PortalShowcase` to windowed (in-scene texture) rendering — it stays a launch card → DOM overlay.
- Any change to the env-driven single-portal fallback elsewhere (only `OtherWorkLevel` moves to the explicit `APPS` list).
- Streaming/native/proxy serve paths for Forge — it is `direct` only.
- Editing `forge-deno.com` itself or its repo.
