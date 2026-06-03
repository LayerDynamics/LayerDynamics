# Portal M4 — Integration, Hardening & Deploy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `lore:execute` to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** Prove `@layerdynamics/portal` against its first real consumer by wiring a live `<Portal>` into the `apps/client` level world (SPEC-002), harden the security surface (allowlist/CSP/sandbox + regression tests), add the dev diagnostics overlay, write the real full-stack E2E, and deploy the provider on Railway.
**Architecture:** `apps/client` adds `@layerdynamics/portal` as a workspace dependency and places a `<Portal>` inside the "Other Work" / a dedicated demo level, pointed at the deployed provider origin. The provider gets production hardening (tight `frame-ancestors`, per-app sandbox enforcement, allowlist 403s with tests) and ships as a Railway Node service. A Playwright E2E drives the host → provider → real registered guest with no mocked layers.
**Tech Stack:** apps/client (R3F 9 level system from SPEC-002), Fastify/`ws` provider, Railway (per deploy memory), Playwright E2E.
**Practices:** Contract-first → Typed-first → TDD; security fixes ship with regression tests (house rule).
**Required skills:** none.
**Depends on:** M3 (all presenters working). Also reads SPEC-002 level architecture + memory `level-system-architecture`, `railway-deploy-and-main-now-holds-app`.
**Spec:** SPEC-003 FR-6/13/17, §3.7 (security), §3.10 (deploy), §6 (success), OQ-5/OQ-7.

---

## Prerequisites
- M3 gate green.
- Resolve OQ-5 with owner: **which real app(s)** become the first registered guests (replacing the `demo-*` fixtures), and their kinds. Do this BEFORE Task 1.
- Read the actual SPEC-002 level files before editing — do not assume structure. Confirm where a portal belongs (likely `apps/client/src/components/scene/levels/OtherWork` or a new demo level). Per house rules, read the files first.

## Product framing
A reusable primitive isn't proven until something real depends on it. M4 turns "the demo harness works" into "a live app runs inside the portfolio's 3D world, deployed," and locks the security boundary the whole design rests on (registered-apps-only).

---

## Task 0: Register the real guest app(s) (owner input)

**Files:**
- Modify: `packages/portal/ssr/lib/AppPortal/AppPortalConfig.ts`
- Modify: `packages/portal/src/data/PortalData.ts`

**Step 1:** With the owner's answer to OQ-5, add the real `AppPortalConfigEntry`(ies) (id, real `origin`, `kind`, `serveStrategy`, `upstream`/`staticDir`, `sandbox`, `defaultSize`) and the matching `PortalDataEntry`. Keep the `demo-*` fixtures (used by the E2E and harness).

**Step 2: Verify** the allowlist test (M0 Task 5) still passes and now includes the real id.

> Do NOT invent an app here. If OQ-5 is unanswered, stop and ask the owner; do not proceed with a fabricated origin.

---

## Task 1: Add portal as a workspace dependency of `apps/client`

**Files:**
- Modify: `apps/client/package.json` (add `"@layerdynamics/portal": "workspace:*"`)
- Run: `pnpm install`

**Step 1:** Add the dependency; install.
**Step 2: Verify** the import resolves:
```bash
cd /Users/ryanoboyle/LayerDynamics && pnpm --filter client exec tsc -b
```
→ Expected: client still type-checks with the new dep available. Do not stage `node_modules/`.

---

## Task 2: Read SPEC-002 level structure, then place a `<Portal>` (browser smoke)

**Files:**
- Read first: the SPEC-002 level files (`apps/client/src/components/scene/**` — confirm exact paths).
- Modify: the chosen level component (e.g. `OtherWork` level) to mount a `<Portal>`.
- Test: a colocated `*.browser.test.tsx`/story smoke per the repo's Storybook-all-components convention.

**Step 1:** Read the level system (`useLevels`, the level component, camera per-level) so the portal is placed within the level's own framing and torn down with it (SPEC-002 levels are a true teardown — the portal must unmount cleanly, releasing its iframe/stream).

**Step 2: Failing smoke test** — the level renders with a portal and disposes without leaking the iframe:
```tsx
// asserts: mounting the level mounts the portal; unmounting removes the iframe sibling (no orphan DOM)
```

**Step 3:** Place `<Portal app="<real-id>" providerOrigin={PORTAL_PROVIDER_ORIGIN} ... />` inside the level. Source `PORTAL_PROVIDER_ORIGIN` from a Vite env (`import.meta.env.VITE_PORTAL_ORIGIN`), defaulting to the same origin in dev.

**Step 4:** Ensure teardown: when the level unmounts, `Portal` disposes its `PortalClient`/iframe/stream (verify the cleanup effects from M1–M3 fire). Add the disposal regression to the test.

**Step 5: Run → PASS** (and the existing client test suite stays green — no regressions).

---

## Task 3: Security hardening + regression tests (TDD — house rule)

**Files:**
- Modify: `packages/portal/ssr/api/app.ts` (CSP/`frame-ancestors`, tighten CORS to host origin)
- Modify: `packages/portal/ssr/lib/AppPortal/Dynamic/APDynamicServe.ts` (set tight `frame-ancestors`, not blanket strip)
- Create: `packages/portal/ssr/api/security.test.ts`

**Step 1: Failing security tests** (write WITH the fix, per the house rule):
```ts
import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from './app'
const app = buildApp({ allowedOrigin: 'https://layerdynamics.example' })
afterAll(() => app.close())

describe('provider security', () => {
  it('refuses every provider route for an unregistered app id (403)', async () => {
    for (const url of ['/static/evil/', '/dynamic/evil/', '/portal/p1?app=evil']) {
      const res = await app.inject({ method: 'GET', url })
      expect(res.statusCode).toBe(403)
    }
    expect((await app.inject({ method: 'POST', url: '/app-portal/evil/warm' })).statusCode).toBe(403)
  })
  it('served/proxied responses restrict framers to the allowed host origin', async () => {
    const res = await app.inject({ method: 'GET', url: '/static/demo-static/' })
    expect(res.headers['content-security-policy']).toContain("frame-ancestors https://layerdynamics.example")
  })
  it('drops off-origin / malformed control messages', () => {
    // unit: isPortalMessage(junk) === false is already covered (M0); assert PortalServer
    // ignores a message whose JSON fails the guard (no session created).
  })
})
```

**Step 2: Run → FAIL.**

**Step 3:** Implement:
- `buildApp({ allowedOrigin })` accepts the host origin; CORS `origin` set to it (not `true`); add an `onSend` hook setting `Content-Security-Policy: frame-ancestors <allowedOrigin>` on served/proxied responses.
- In `APDynamicServe.rewriteHeaders`, replace the blanket strip with an explicit `content-security-policy: frame-ancestors <allowedOrigin>` and remove only `x-frame-options`.
- Enforce per-app `sandbox` is applied by the client (already done in `DomWindowPresenter` M1); add a provider assertion test that the negotiated descriptor carries the app's sandbox tokens.

**Step 4: Run → PASS.** These are the FR-6/FR-17 regression tests required before the security work is "done."

---

## Task 4: Dev diagnostics overlay (browser smoke)

**Files:**
- Create: `packages/portal/src/components/PortalDebugOverlay.tsx`
- Test: `packages/portal/src/components/PortalDebugOverlay.browser.test.tsx`

**Step 1: Failing smoke test** — overlay lists each portal's `state`, presenter, and quad-registration error when `import.meta.env.DEV` (or a `debug` prop).

**Step 2–4:** Implement a DOM overlay (not in-canvas) that subscribes to `portalStore` and renders, per portal: `id`, `state`, chosen presenter, `quad` size, and (for dom-window) the measured pixel offset between the iframe rect and the projected quad. Gate behind a `debug` prop, default off.

**Step 5: Run → PASS.**

---

## Task 5: Real full-stack E2E (no mocked layers — house-rule E2E)

**Files:**
- Create: `packages/portal/e2e/portal.e2e.spec.ts` (Playwright)
- Create: `packages/portal/playwright.config.ts`
- Modify: `packages/portal/package.json` (add `"test:e2e": "playwright test"`, devDep `@playwright/test`)

**Step 1:** Author an E2E that boots the **real** stack and asserts the real user-facing workflow (meets the global CLAUDE.md E2E definition — every layer runs, nothing mocked):
```ts
import { test, expect } from '@playwright/test'

// Global setup (playwright.config) starts: provider (5179) + demo-static fixture +
// the harness (5183) — all real processes. No stubs.
test('a registered cross-origin app is interactive inside the 3D scene', async ({ page }) => {
  await page.goto('http://localhost:5183')
  // Engage the portal (click its aperture).
  await page.locator('canvas').click({ position: { x: 200, y: 300 } })
  // The guest iframe appears as a real same-origin frame.
  const frame = page.frameLocator('iframe')
  // Real interaction: clicking the guest's button increments its counter.
  await frame.locator('#b').click()
  await expect(frame.locator('#n')).toHaveText('1')
  // Real typing reaches the guest input.
  await frame.locator('#t').fill('hello portal')
  await expect(frame.locator('#out')).toHaveText('hello portal')
})

test('disengaging suspends the guest (iframe removed / pointer-events off)', async ({ page }) => {
  await page.goto('http://localhost:5183')
  await page.locator('canvas').click({ position: { x: 200, y: 300 } })
  await expect(page.locator('iframe')).toBeVisible()
  // Engage a second portal → first demotes to idle (MAX_LIVE=1).
  await page.locator('canvas').click({ position: { x: 600, y: 300 } })
  await expect(page.locator('iframe').first()).toHaveCSS('pointer-events', 'none')
})
```

**Step 2:** `playwright.config.ts` `webServer` array launches provider + fixture + harness as real processes before tests, tears them down after.

**Step 3: Run → PASS**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec playwright install --with-deps chromium && pnpm test:e2e
```
→ Expected: both E2E tests PASS against the live stack. This is the SPEC §6 "interactive-in-place works" launch metric, proven end-to-end.

---

## Task 6: Railway deploy of the provider

**Files:**
- Create: `packages/portal/railway.toml` (or root config per existing deploy — read `railway-deploy-and-main-now-holds-app` memory + existing `railway.toml` first)
- Create: `packages/portal/ssr/Dockerfile` or a Nixpacks build (match the repo's existing deploy approach)

**Step 1:** Read the existing Railway setup (root `railway.toml`, root `package.json` start script) so the provider deploys consistently — do not invent a second deploy pattern. Note the Vite `preview` `allowedHosts` gotcha from memory if the harness is also deployed (OQ-7).

**Step 2:** Configure the provider service: build (`pnpm --filter @layerdynamics/portal build` then run `ssr/api/server.ts` via `tsx`/compiled output), `PORTAL_PORT` from Railway's `$PORT`, and `allowedOrigin` env = the deployed `apps/client` origin.

**Step 3:** Deploy via the Railway MCP/skill (use `use-railway`). Set `VITE_PORTAL_ORIGIN` in the client deploy to the provider's generated domain.

**Step 4: Verify** the deployed provider:
```bash
curl -s https://<provider-domain>/healthz        # → {"ok":true}
curl -s https://<provider-domain>/config | head   # → registered apps, no origin leak
```

**Step 5:** Remind the owner to redeploy `apps/client` so it picks up `VITE_PORTAL_ORIGIN` (infra-change reminder per house rule).

---

## Done when (M4 gate — and SPEC-003 success criteria)
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal
pnpm exec tsc -b && pnpm exec vitest run && pnpm exec eslint . && pnpm test:e2e
cd /Users/ryanoboyle/LayerDynamics && pnpm --filter client build   # consumer still builds
```
- [ ] A real registered app runs **live inside a SPEC-002 level** and tears down with it (no orphan iframe).
- [ ] Every provider route refuses unregistered ids (403) — regression-tested.
- [ ] Served/proxied responses restrict `frame-ancestors` to the host origin — tested.
- [ ] Full-stack E2E passes: click + type reach the windowed app; disengage suspends it. No mocked layers.
- [ ] Provider deployed on Railway; `/healthz` + `/config` reachable; client points at `VITE_PORTAL_ORIGIN`.
- [ ] SPEC §6 launch metrics demonstrably met (interactive-in-place, all-kinds coverage, allowlist 100%, host fps).

## TODOs discovered (do NOT fix here / future spec work)
- Replace remaining `demo-*` fixtures with additional real apps as they come online (ongoing).
- WebRTC stream path if ImageBitmap latency proves insufficient on the real streamed app.
- Optional guest state persistence across idle→live (SPEC FR-16).
- Multi-region / autoscaling provider (SPEC explicit non-goal v1).
