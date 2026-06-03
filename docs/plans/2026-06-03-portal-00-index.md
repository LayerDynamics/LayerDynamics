# Portal Provider — Implementation Plan Index (SPEC-003)

> **For Claude:** REQUIRED SUB-SKILL: Use `lore:execute` to implement each milestone plan task-by-task.
> **Scope guard:** Do ONLY what is listed in each milestone plan. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Spec:** `docs/specs/SPEC-003-portal-provider.md`
**Goal:** Build `@layerdynamics/portal` — an R3F client library + Fastify/`ws` Node provider that windows another world/app (three.js-native, static, dynamic/SSR, or socket-streamed) into a three.js scene, fully interactive in place, engagement-gated.
**Tech Stack:** TypeScript ~6.0, React 19.2 + R3F 9 + drei 10.7 + three 0.184 + zustand 5 + @react-spring/three 10 (client); Node 24 ESM + Fastify 5 + `ws` 8 + @fastify/http-proxy + @fastify/static (provider); Vitest 4 (node + browser/Playwright) for tests; Vite 8 build.
**Practices (all milestones):** **Contract-first** → **Typed-interfaces-first** → **TDD** (failing test → minimal impl → green). Security-touching code ships with its regression test (house rule).
**Required skills:** none (no Claude Code plugin/MCP/agent/SDK surface).

---

## Why this is split into milestone files

SPEC-003 §4.1 defines five build phases with hard dependency ordering (M0→M1→M2→M3→M4). Each is independently shippable behind the package boundary. One plan file per milestone keeps each execution session bite-sized and lets `lore:execute` checkpoint between milestones.

| # | Plan file | Milestone | Delivers | Depends on |
|---|-----------|-----------|----------|-----------|
| 0 | `2026-06-03-portal-m0-foundations.md` | **M0 Foundations** | Shared types, config/allowlist, package/tsconfig setup, frozen client↔provider contract, test harness | — |
| 1 | `2026-06-03-portal-m1-dom-window.md` | **M1 DOM-window MVP** | Provider serve/proxy (`Static`/`Dynamic`) + client `DomWindowPresenter` + projected-quad sync + `Portal`/`PortalEdge`/`PortalFluid` + demo harness | M0 |
| 2 | `2026-06-03-portal-m2-lifecycle.md` | **M2 Lifecycle** | `Dormant→Warming→Live→Idle` state machine, `MAX_LIVE`, guest suspend/resume, `PortalTransition` | M1 |
| 3 | `2026-06-03-portal-m3-presenters.md` | **M3 All-works** | `TexturePresenter` (WS ImageBitmap → `WebGLRenderTarget`) + `StencilPresenter` (drei `MeshPortalMaterial`) + presenter fallthrough + input forwarding | M2 |
| 4 | `2026-06-03-portal-m4-integration.md` | **M4 Integration** | Wire `<Portal>` into `apps/client` (SPEC-002 level), security/CSP/sandbox hardening, dev overlay, Railway deploy | M3 |

## Frozen contract (set in M0, consumed by all later milestones)

The single source of truth both sides import is `packages/portal/shared/contract.ts` (created in M0). Client and provider **must not** redefine these shapes locally. Any change to the contract is a contract-first task: edit `shared/contract.ts` first, let `tsc -b` fail on both sides, then update consumers.

Key contract surfaces (full definitions in M0 plan):
- `AppKind = 'native' | 'static' | 'dynamic' | 'stream'`
- `PresenterKind = 'dom-window' | 'texture' | 'stencil'`
- `RegisteredApp`, `AppPortalConfigEntry` (provider allowlist), `PortalDataEntry` (client mirror)
- `TransportDescriptor` (negotiation result)
- `PortalState = 'dormant' | 'warming' | 'live' | 'idle'`
- Control-channel message union `PortalMessage` (`negotiate`/`warm`/`engaged`/`idle`/`dispose`/`input`/`state`/`error`) with `targetOrigin` validation
- Provider route paths (`/config`, `/portal/:id`, `/app-portal/:appId/*`, `/static/:appId/*`, `/dynamic/:appId/*`, `/stream/:appId`, `/transitions/*`)

## Workspace layout this plan creates/fills

```
packages/portal/
  package.json              # M0: real deps + scripts
  tsconfig.json             # M0: project refs → web + node
  tsconfig.web.json         # M0: client (DOM, react-jsx)
  tsconfig.node.json        # M0: provider (node, ESM)
  vitest.config.ts          # M0: node + browser projects
  shared/contract.ts        # M0: the frozen contract (NEW dir)
  src/...                   # client (M0 types → M1–M3 impl)
  ssr/...                   # provider (M0 config → M1–M3 impl)
  index.html, src/App.tsx, src/main.tsx   # M1 demo harness
```

> `shared/` is a new directory not in the original scaffold; it exists so client (`tsconfig.web`) and provider (`tsconfig.node`) reference one contract module without a circular project dependency.

## Execution order

Run the milestone plans in order with `lore:execute`. Each plan ends with a "Done when" gate that must be green (`tsc -b`, lint, the milestone's tests) before starting the next. Do not start M(n+1) until M(n)'s gate passes.

## Cross-cutting rules (apply in every milestone)

1. **No stubs.** Every function fully implemented. If a piece can't be finished in a milestone, it isn't in that milestone's scope — it's listed in a later plan.
2. **Fix the scaffold typo once:** `ssr/lib/AppPortal/AppPortalManager.ts.ts` → `AppPortalManager.ts` (M0, Task 1).
3. **Allowlist first:** every provider route validates `:appId`/origin against `AppPortalConfig` before doing anything (refuse unknown → 403). Tested in M1.
4. **House rules:** ask before `git commit`; never stage `node_modules/`; tag markdown code blocks; reverting own changes uses `Edit`, never `git checkout/restore`.
5. **Don't pre-fill unrelated `packages/*`.** Only `packages/portal` is in scope.
