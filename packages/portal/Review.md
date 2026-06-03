# Code Review: `@layerdynamics/portal` (SPEC-003 Portal Provider)

> Git-free, fresh-eyes review of the M0 foundations slice. Date: 2026-06-03.
> Verification run: `pnpm typecheck` → exit 0; `pnpm test:unit` → 23/23 passed; `pnpm lint` → 1 error.

## Summary

`@layerdynamics/portal` is a two-sided system that windows a live, cross-origin guest app *into* an R3F 3D scene: a Node/Fastify **provider** (`ssr/`) that serves/proxies/streams registered guests same-origin, and an R3F **client** (`src/`) that presents them. This review covers the **M0 foundations** slice — the only code with content. The contract layer, provider HTTP routes, allowlist, negotiation, and the WS lifecycle channel are implemented and tested; **all of `src/components`, `src/hooks`, `src/stores`, `src/io`, and several `ssr/lib` files are still 0-byte stubs** (expected — M1+). The implemented surface (~674 lines) is clean, well-commented, and `tsc -b` + 23 node tests pass — but **`pnpm lint` currently fails**, breaking the package's own declared CI gate (spec §3.10).

## Findings

### High

- **`pnpm lint` fails — CI gate is red** (`ssr/api/app.ts:16`) — `buildApp(_opts: BuildAppOptions = {})` trips `@typescript-eslint/no-unused-vars` (`'_opts' is assigned a value but never used`). `tsc` passes because `noUnusedParameters` honors the leading-underscore convention, but the eslint config (`eslint.config.js`) never sets `argsIgnorePattern: '^_'`, so the two tools disagree. Spec §4.1/§3.10 require `tsc -b` **+ lint** + tests green; today they aren't. Verified: `eslint .` → `✖ 1 problem`.

- **`allowedOrigin` is threaded end-to-end but silently dropped — the security knob is a no-op** (`ssr/api/app.ts:16-20`, `ssr/api/server.ts:5`) — `server.ts` reads `PORTAL_ALLOWED_ORIGIN`, passes it as `buildApp({ allowedOrigin })`, but `buildApp` ignores `_opts` and registers `cors({ origin: true })`, which **reflects any requesting origin**. There is also no `Content-Security-Policy: frame-ancestors` / `X-Frame-Options` set on the provider itself. The wiring *looks* complete at every layer, which is worse than an obvious gap — and it's the direct cause of the lint failure. Spec §3.7 requires origin restriction; even if M0 is intentionally permissive, an env var that appears live and does nothing is a trap. **Fix once, fix both:** actually consume `allowedOrigin` (CORS origin + `frame-ancestors`), which resolves this *and* the lint error.

### Medium

- **WS `close` handler wipes other portals' sessions** (`ssr/lib/Portal/PortalServer.ts:28-30`) — `sessions` is created once per `attachPortalSocket` and shared across **all** connections. On any single client disconnect, the handler iterates the whole map and deletes every session whose state `!== 'dormant'`, i.e. all `live`/`idle` portals for *every* connected client. This is reachable live code (`server.ts` calls `attachPortalSocket(app.server)`), not dead scaffolding. Sessions should be keyed/cleaned per-connection.

- **`AppPortalManager.get()` leaks the global allowlist; `has()` does not** (`ssr/lib/AppPortal/AppPortalManager.ts:16-18`) — `get(id)` returns `this.apps.get(id) ?? getApp(id)`, falling back to the module-level `REGISTERED_APPS` even when the manager was constructed with a deliberately restricted subset. `has()` correctly consults only `this.apps`. `negotiateTransport` uses `get()`, so an app *excluded* from a manager instance can still be negotiated — defeating dependency injection and any future per-deployment scoping. Drop the `?? getApp(id)` fallback so instance scope is authoritative.

- **Lifecycle skips `warming`** (`ssr/lib/Portal/PortalServer.ts:52-63`) — the `warm` message jumps the display straight to `live` and emits `state: 'live'`; the `Dormant → Warming → Live` progression in the spec/data-model is never expressed and no `warming` state is ever sent. Pre-M2 this is partially expected, but `PortalServer` is already wired and reachable, so the channel currently misrepresents lifecycle.

- **Client `PORTAL_DATA` hand-duplicates provider `REGISTERED_APPS` with no drift guard** (`src/data/PortalData.ts:5-10` vs `ssr/lib/AppPortal/AppPortalConfig.ts:4-47`) — the four demo apps' `id/label/kind/preferredPresenter/defaultSize` are copied across the boundary by hand. `/config` already derives the exact client mirror from the provider (`Config.ts`), so the static `PORTAL_DATA` is both redundant and free to silently diverge. At minimum add a test asserting `PORTAL_DATA` ids ⊆ `REGISTERED_APPS` ids.

### Low

- **Test binds a real fixed port** (`ssr/api/routes/Dynamic.test.ts:11`) — `upstream.listen({ port: 5181 })` collides if 5181 is busy (CI flake) and is hard-coupled to the `upstream` value in `AppPortalConfig`. Prefer port 0 + reading the assigned port, or document the coupling.
- **Allowlist hook checks registration but not kind** (`ssr/api/routes/Static.ts:7-12`) — `/static/demo-dynamic/` passes the 403 guard (`manager.has('demo-dynamic')` is true) yet no static route is registered for it → 404. The guard asserts "registered," not "registered *as static*." Minor inconsistency.
- **Per-route global `onRequest` allowlist hooks** (`ssr/api/routes/Static.ts:7`, `ssr/api/routes/Dynamic.ts:7`) — each route module adds an app-wide hook that runs on every request and pattern-matches its own prefix. Harmless now; grows into N global hooks as routes are added. Consider scoping via encapsulated plugins.
- **Magic constant `426`** (`ssr/lib/Portal/PortalAppConnector.ts:27`) — `~426 px per world unit` is undocumented in derivation; fine but worth a named const/rationale.

### Testing gaps

- **WS layer untested.** `isPortalMessage` is unit-tested in isolation (`shared/contract.test.ts:50`), but `attachPortalSocket`'s handler — which uses it to drop off-protocol traffic — has no test, so neither the security-drop path nor the `close`-handler bug above is covered. The spec's "off-origin/malformed message dropped" security regression (§4.2) is not yet written.
- **No client↔provider config-drift test** (see Medium above).
- **Multi-static `decorateReply: first` toggle unexercised** (`ssr/lib/AppPortal/Static/APStaticServe.ts:9-18`) — only one `static` app is registered, so the 2nd-registration path (`decorateReply: false`) never runs.

## Strengths

- **`shared/contract.ts` is an exemplary boundary** — single source of truth, explicitly DOM/Node-agnostic, string-union "enums" (matches the repo's `erasableSyntaxOnly` house style), canonical `ROUTES` builders, and a real runtime guard (`isPortalMessage`) driven by a declarative `MESSAGE_REQUIRED` table.
- **Allowlist defense-in-depth** — enforced at three layers: route `onRequest` 403, `negotiateTransport` returning `null`, and serve strategies only registering known ids. No open proxy.
- **`/config` deliberately strips `origin`/`sandbox`** so server-only secrets never reach the client, *with* a test asserting `origin` is undefined (`ssr/api/app.test.ts:13`).
- **Tests are real, not mocked** — `app.inject` against the composed Fastify app, and a genuine upstream Fastify instance the proxy actually reaches (`ssr/api/routes/Dynamic.test.ts`). This matches the house anti-mock / E2E ethos.
- **Comments explain *why*** (same-origin-proxy rationale, the M4 header-hardening TODO, the `decorateReply` quirk) — the architecture reads clearly even with most files still empty.

## Recommendations (prioritized)

1. **Make `allowedOrigin` real** — consume it in `buildApp` for CORS `origin` and add `frame-ancestors`. This fixes the High security no-op **and** the High lint failure in one change; add `argsIgnorePattern: '^_'` to the eslint config only for genuinely-reserved params.
2. **Fix the `close` handler** to clean up only the disconnecting connection's sessions (track sessions per-socket), and add a WS-layer test covering both the malformed-message drop and disconnect cleanup.
3. **Remove the `?? getApp(id)` fallback** in `AppPortalManager.get()` so instance scope is authoritative and consistent with `has()`.
4. **Add a config-drift test** (`PORTAL_DATA` ↔ `REGISTERED_APPS` ids), or generate `PORTAL_DATA` from `/config` and delete the hand-copy.
5. **De-flake `Dynamic.test.ts`** (ephemeral port) and tighten the static allowlist guard to also check `kind`/strategy.
6. When M2 lands, emit the real `warming` state rather than jumping to `live`.
