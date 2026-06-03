# Portal M0 — Foundations & Contract Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `lore:execute` to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** Establish the buildable `@layerdynamics/portal` package skeleton and freeze the typed client↔provider contract both sides will build against — no portal behavior yet, but `tsc -b` green on both projects and the test harness running.
**Architecture:** A pnpm workspace package with three TS project references — `shared` (the contract, DOM-agnostic), `web` (client, references shared), `node` (provider, references shared). The contract module defines every shape that crosses the host/provider boundary; M1–M4 import it and never redefine it.
**Tech Stack:** TypeScript ~6.0, Vitest 4, Node 24 ESM. (Runtime deps for client/provider are declared now but exercised in later milestones.)
**Practices:** Contract-first → Typed-first → TDD.
**Required skills:** none.
**Spec:** `docs/specs/SPEC-003-portal-provider.md` (§3.3 data model, §3.4 API, §3.7 security).

---

## Prerequisites

- Run from repo root `/Users/ryanoboyle/LayerDynamics`.
- `pnpm` available; `packages/portal` already globbed by `pnpm-workspace.yaml`.

## Product framing

Portal is a **two-sided system**: a host R3F library and a Node provider that makes cross-origin guest apps embeddable. M0 builds nothing visible — it makes the package compile and locks the wire/type contract so client and provider can be built in parallel afterward without drift.

---

## Task 1: Fix scaffold typo + create `shared/` directory

**Files:**
- Rename: `packages/portal/ssr/lib/AppPortal/AppPortalManager.ts.ts` → `packages/portal/ssr/lib/AppPortal/AppPortalManager.ts`
- Create: `packages/portal/shared/` (dir)

**Step 1:** Rename the double-extension file (it is 0 bytes; safe).
```bash
cd /Users/ryanoboyle/LayerDynamics
git mv packages/portal/ssr/lib/AppPortal/AppPortalManager.ts.ts packages/portal/ssr/lib/AppPortal/AppPortalManager.ts 2>/dev/null \
  || mv packages/portal/ssr/lib/AppPortal/AppPortalManager.ts.ts packages/portal/ssr/lib/AppPortal/AppPortalManager.ts
mkdir -p packages/portal/shared
```
> The files are untracked, so `git mv` may not apply — the `||` fallback handles it. Per house rules this is renaming an empty placeholder I am creating the content for, not destroying user work.

**Step 2: Verify**
```bash
ls packages/portal/ssr/lib/AppPortal/AppPortalManager.ts && echo OK
```
→ Expected: `OK`, and no `.ts.ts` remains.

---

## Task 2: Package manifest + scripts

**Files:**
- Modify: `packages/portal/package.json`

**Step 1: Write the manifest** (replace the 4-line stub entirely):
```json
{
  "name": "@layerdynamics/portal",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./contract": "./shared/contract.ts"
  },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -b --noEmit",
    "dev:client": "vite",
    "dev:server": "tsx watch ssr/api/server.ts",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:unit": "vitest run --project node",
    "test:browser": "vitest run --project browser"
  },
  "peerDependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "three": "^0.184.0",
    "@react-three/fiber": "^9.6.1"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.7",
    "@react-spring/three": "^10.1.0",
    "zustand": "^5.0.8",
    "fastify": "^5.2.0",
    "@fastify/http-proxy": "^10.0.0",
    "@fastify/static": "^8.0.0",
    "@fastify/cors": "^10.0.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/three": "^0.184.0",
    "@types/ws": "^8.5.13",
    "tsx": "^4.19.0",
    "typescript": "~6.0.2",
    "vite": "^8.0.12",
    "vitest": "^4.1.8",
    "@vitest/browser": "^4.1.8",
    "@vitest/browser-playwright": "^4.1.8",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^10.0.0"
  }
}
```

**Step 2: Install**
```bash
cd /Users/ryanoboyle/LayerDynamics && pnpm install
```
→ Expected: installs without resolution errors. Do NOT stage `node_modules/`.

**Step 3: Pause for owner** — confirm versions resolve on this machine before continuing (some `^` ranges may float). If any package 404s or conflicts, report the exact error and the resolved alternative; do not silently downgrade.

---

## Task 3: TypeScript project references (3 projects)

**Files:**
- Modify: `packages/portal/tsconfig.json`, `tsconfig.web.json`, `tsconfig.node.json`
- Create: `packages/portal/tsconfig.shared.json`

**Step 1: Root solution `tsconfig.json`:**
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.shared.json" },
    { "path": "./tsconfig.web.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**Step 2: `tsconfig.shared.json`** (DOM-agnostic contract — no `dom`, no `node` libs that would let one side leak into the other):
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "lib": ["ES2023"],
    "strict": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "isolatedModules": true,
    "declaration": true,
    "outDir": "./dist/shared",
    "rootDir": "./shared"
  },
  "include": ["shared/**/*.ts"]
}
```

**Step 3: `tsconfig.web.json`** (client — DOM + react-jsx, references shared):
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["three"]
  },
  "references": [{ "path": "./tsconfig.shared.json" }],
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

**Step 4: `tsconfig.node.json`** (provider — node libs, references shared):
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "lib": ["ES2023"],
    "strict": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"]
  },
  "references": [{ "path": "./tsconfig.shared.json" }],
  "include": ["ssr/**/*.ts"]
}
```
> `erasableSyntaxOnly` matches the repo convention (SPEC-001: unions not enums). All contract enumerations are string-literal unions, never `enum`.

**Step 5: Verify the build graph wires up** (will fail on empty TS files until Task 4 — that's expected here; just confirm config parses):
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec tsc -b --dry
```
→ Expected: prints the build order (shared → web/node), no config parse errors.

---

## Task 4: The frozen contract — types (TDD)

This is the heart of M0. **Contract-first**: write the type-level test, then the contract that satisfies it.

**Files:**
- Create: `packages/portal/shared/contract.ts`
- Test: `packages/portal/shared/contract.test.ts`

**Step 1: Write the failing test** (`contract.test.ts`) — exercises the contract as real values so a missing/renamed field fails compilation AND the run:
```ts
import { describe, it, expect } from 'vitest'
import {
  APP_KINDS,
  PRESENTER_KINDS,
  PORTAL_STATES,
  ROUTES,
  isPortalMessage,
  type RegisteredApp,
  type TransportDescriptor,
  type PortalMessage,
} from './contract'

describe('portal contract', () => {
  it('enumerates the four app kinds and three presenters as string unions', () => {
    expect(APP_KINDS).toEqual(['native', 'static', 'dynamic', 'stream'])
    expect(PRESENTER_KINDS).toEqual(['dom-window', 'texture', 'stencil'])
    expect(PORTAL_STATES).toEqual(['dormant', 'warming', 'live', 'idle'])
  })

  it('builds a RegisteredApp value matching the type', () => {
    const app: RegisteredApp = {
      id: 'demo-static',
      label: 'Demo Static',
      kind: 'static',
      origin: 'http://localhost:5180',
      serveStrategy: 'static',
      preferredPresenter: 'dom-window',
      sandbox: ['allow-scripts', 'allow-forms'],
      defaultSize: [3, 2],
    }
    expect(app.kind).toBe('static')
  })

  it('builds a dom-window TransportDescriptor', () => {
    const t: TransportDescriptor = {
      transport: 'dom-window',
      url: '/dynamic/demo-static/',
      sandbox: ['allow-scripts'],
      dims: [1280, 720],
    }
    expect(t.transport).toBe('dom-window')
  })

  it('exposes the canonical route templates', () => {
    expect(ROUTES.config).toBe('/config')
    expect(ROUTES.portal(':id')).toBe('/portal/:id')
    expect(ROUTES.stream('demo')).toBe('/stream/demo')
  })

  it('validates control-channel messages by shape and rejects junk', () => {
    const msg: PortalMessage = { type: 'warm', portalId: 'p1', appId: 'demo-static' }
    expect(isPortalMessage(msg)).toBe(true)
    expect(isPortalMessage({ type: 'nope' })).toBe(false)
    expect(isPortalMessage(null)).toBe(false)
    expect(isPortalMessage({ type: 'input' })).toBe(false) // missing required fields
  })
})
```

**Step 2: Run to verify it fails**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vitest run shared/contract.test.ts
```
→ Expected: FAIL (module `./contract` not found).

**Step 3: Write the contract** (`contract.ts`) — complete, no stubs:
```ts
// The single source of truth for every shape that crosses the host↔provider
// boundary. Client (tsconfig.web) and provider (tsconfig.node) both import this.
// DOM/Node-agnostic: no `window`, no `process`, no three.js imports here.

export const APP_KINDS = ['native', 'static', 'dynamic', 'stream'] as const
export type AppKind = (typeof APP_KINDS)[number]

export const PRESENTER_KINDS = ['dom-window', 'texture', 'stencil'] as const
export type PresenterKind = (typeof PRESENTER_KINDS)[number]

export const PORTAL_STATES = ['dormant', 'warming', 'live', 'idle'] as const
export type PortalState = (typeof PORTAL_STATES)[number]

export type ServeStrategy = 'static' | 'dynamic' | 'stream' | 'native'

/** Iframe sandbox tokens (subset we use). */
export type SandboxToken =
  | 'allow-scripts'
  | 'allow-forms'
  | 'allow-popups'
  | 'allow-modals'
  | 'allow-pointer-lock'
  | 'allow-downloads'
  | 'allow-same-origin'

/** A registered, allowlisted guest app. Provider AppPortalConfig is source of truth;
 *  PortalDataEntry (client) is a UI-facing mirror with a subset of these fields. */
export interface RegisteredApp {
  id: string
  label: string
  kind: AppKind
  /** Real origin of the guest (url:port). Provider serves/proxies/streams this. */
  origin: string
  serveStrategy: ServeStrategy
  preferredPresenter: PresenterKind
  /** Sandbox tokens applied to the dom-window iframe for this app. */
  sandbox: SandboxToken[]
  /** Default aperture size in world units [w, h]. */
  defaultSize: [number, number]
}

/** Client-side mirror (no origin/sandbox secrets needed to place a portal). */
export type PortalDataEntry = Pick<
  RegisteredApp,
  'id' | 'label' | 'kind' | 'preferredPresenter' | 'defaultSize'
>

/** Provider allowlist entry = RegisteredApp plus serving knobs. */
export interface AppPortalConfigEntry extends RegisteredApp {
  /** For 'static': absolute path to the built dir the provider serves. */
  staticDir?: string
  /** For 'dynamic': upstream base the provider reverse-proxies same-origin. */
  upstream?: string
  /** Header overrides applied to served/proxied responses (e.g. relax frame-ancestors). */
  headers?: Record<string, string>
}

/** Result of host↔provider negotiation — tells the host how to present app X. */
export interface TransportDescriptor {
  transport: PresenterKind
  /** dom-window: same-origin URL the iframe loads (served/proxied by provider). */
  url?: string
  /** stream/texture: WS endpoint that emits frames. */
  streamEndpoint?: string
  /** native: true → render in-engine, no DOM/stream. */
  native?: boolean
  sandbox?: SandboxToken[]
  /** Intrinsic guest pixel dims for texture sizing / iframe logical size. */
  dims?: [number, number]
}

/** Control-channel message union (host↔provider, validated targetOrigin). */
export type PortalMessage =
  | { type: 'negotiate'; portalId: string; appId: string }
  | { type: 'warm'; portalId: string; appId: string }
  | { type: 'engaged'; portalId: string }
  | { type: 'idle'; portalId: string }
  | { type: 'dispose'; portalId: string }
  | { type: 'input'; portalId: string; event: ForwardedInput }
  | { type: 'state'; portalId: string; state: PortalState }
  | { type: 'error'; portalId: string; message: string }

/** Serializable input forwarded to a texture-presented guest (FR-9). */
export interface ForwardedInput {
  kind: 'pointerdown' | 'pointermove' | 'pointerup' | 'wheel' | 'keydown' | 'keyup'
  /** Normalized [0..1] coordinates within the portal aperture. */
  x?: number
  y?: number
  button?: number
  deltaY?: number
  key?: string
  code?: string
}

/** Canonical route templates. Functions take an id and return the concrete path. */
export const ROUTES = {
  config: '/config',
  portal: (id: string) => `/portal/${id}`,
  appPortal: (appId: string, action: 'warm' | 'suspend' | 'dispose') =>
    `/app-portal/${appId}/${action}`,
  static: (appId: string) => `/static/${appId}`,
  dynamic: (appId: string) => `/dynamic/${appId}`,
  stream: (appId: string) => `/stream/${appId}`,
  transitions: '/transitions',
} as const

const MESSAGE_REQUIRED: Record<PortalMessage['type'], readonly string[]> = {
  negotiate: ['portalId', 'appId'],
  warm: ['portalId', 'appId'],
  engaged: ['portalId'],
  idle: ['portalId'],
  dispose: ['portalId'],
  input: ['portalId', 'event'],
  state: ['portalId', 'state'],
  error: ['portalId', 'message'],
}

/** Runtime guard — used on both sides to reject malformed / off-origin traffic. */
export function isPortalMessage(value: unknown): value is PortalMessage {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.type !== 'string') return false
  const required = MESSAGE_REQUIRED[v.type as PortalMessage['type']]
  if (!required) return false
  return required.every((k) => v[k] !== undefined && v[k] !== null)
}
```

**Step 4: Run to verify it passes**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vitest run shared/contract.test.ts
```
→ Expected: PASS (5 tests).

**Step 5: Commit** (ask owner first per house rule)
```bash
git add packages/portal/shared packages/portal/package.json packages/portal/tsconfig*.json
git commit -m "feat(portal): freeze client↔provider contract + package foundations (M0)"
```

---

## Task 5: Provider allowlist config + client mirror (TDD)

**Files:**
- Create: `packages/portal/ssr/lib/AppPortal/AppPortalConfig.ts` (fill the 0-byte file)
- Create: `packages/portal/src/data/PortalData.ts` (fill the 0-byte file)
- Test: `packages/portal/ssr/lib/AppPortal/AppPortalConfig.test.ts`

**Step 1: Write the failing test:**
```ts
import { describe, it, expect } from 'vitest'
import { REGISTERED_APPS, getApp, isRegistered } from './AppPortalConfig'

describe('AppPortalConfig allowlist', () => {
  it('only resolves registered app ids', () => {
    expect(isRegistered('demo-static')).toBe(true)
    expect(isRegistered('evil.example.com')).toBe(false)
  })
  it('getApp returns the full entry for a registered id and undefined otherwise', () => {
    expect(getApp('demo-static')?.origin).toBeDefined()
    expect(getApp('nope')).toBeUndefined()
  })
  it('every entry has a serveStrategy consistent with its kind', () => {
    for (const a of REGISTERED_APPS) {
      if (a.kind === 'static') expect(a.serveStrategy).toBe('static')
      if (a.kind === 'native') expect(a.serveStrategy).toBe('native')
    }
  })
})
```

**Step 2: Run → FAIL**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vitest run ssr/lib/AppPortal/AppPortalConfig.test.ts
```

**Step 3: Implement `AppPortalConfig.ts`** (one real example per kind so M1+ have fixtures; expand in M4 with the owner's real apps — OQ-5):
```ts
import type { AppPortalConfigEntry } from '../../../shared/contract'

/** The allowlist. Nothing outside this array may be served, proxied, or streamed. */
export const REGISTERED_APPS: AppPortalConfigEntry[] = [
  {
    id: 'demo-static',
    label: 'Demo Static Build',
    kind: 'static',
    origin: 'http://localhost:5180',
    serveStrategy: 'static',
    preferredPresenter: 'dom-window',
    sandbox: ['allow-scripts', 'allow-forms'],
    defaultSize: [3, 2],
    staticDir: new URL('../../fixtures/demo-static', import.meta.url).pathname,
  },
  {
    id: 'demo-dynamic',
    label: 'Demo Live App',
    kind: 'dynamic',
    origin: 'http://localhost:5181',
    serveStrategy: 'dynamic',
    preferredPresenter: 'dom-window',
    sandbox: ['allow-scripts', 'allow-forms', 'allow-popups'],
    defaultSize: [3.2, 2],
    upstream: 'http://localhost:5181',
  },
  {
    id: 'demo-stream',
    label: 'Demo Streamed App',
    kind: 'stream',
    origin: 'http://localhost:5182',
    serveStrategy: 'stream',
    preferredPresenter: 'texture',
    sandbox: [],
    defaultSize: [2.4, 1.6],
  },
  {
    id: 'demo-native',
    label: 'Demo Native World',
    kind: 'native',
    origin: 'self',
    serveStrategy: 'native',
    preferredPresenter: 'stencil',
    sandbox: [],
    defaultSize: [2.5, 2.5],
  },
]

const BY_ID = new Map(REGISTERED_APPS.map((a) => [a.id, a]))

export function isRegistered(id: string): boolean {
  return BY_ID.has(id)
}

export function getApp(id: string): AppPortalConfigEntry | undefined {
  return BY_ID.get(id)
}
```

**Step 4: Implement `PortalData.ts`** (client mirror — derives placement-facing fields, no secrets):
```ts
import type { PortalDataEntry } from '../../shared/contract'

/** UI-facing catalog of placeable portals. Mirrors AppPortalConfig ids; the
 *  provider remains the security source of truth (origin/sandbox live there). */
export const PORTAL_DATA: PortalDataEntry[] = [
  { id: 'demo-static', label: 'Demo Static Build', kind: 'static', preferredPresenter: 'dom-window', defaultSize: [3, 2] },
  { id: 'demo-dynamic', label: 'Demo Live App', kind: 'dynamic', preferredPresenter: 'dom-window', defaultSize: [3.2, 2] },
  { id: 'demo-stream', label: 'Demo Streamed App', kind: 'stream', preferredPresenter: 'texture', defaultSize: [2.4, 1.6] },
  { id: 'demo-native', label: 'Demo Native World', kind: 'native', preferredPresenter: 'stencil', defaultSize: [2.5, 2.5] },
]

const BY_ID = new Map(PORTAL_DATA.map((e) => [e.id, e]))
export function getPortalData(id: string): PortalDataEntry | undefined {
  return BY_ID.get(id)
}
```

**Step 5: Run → PASS**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vitest run ssr/lib/AppPortal/AppPortalConfig.test.ts
```

---

## Task 6: Vitest config (node + browser projects)

**Files:**
- Create: `packages/portal/vitest.config.ts`

**Step 1: Write config** (mirrors `apps/client`'s two-project split per CLAUDE.md):
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['shared/**/*.test.ts', 'ssr/**/*.test.ts', 'src/**/*.unit.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          browser: {
            enabled: true,
            provider: 'playwright',
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
```

**Step 2: Verify both projects discover tests**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vitest run --project node
```
→ Expected: PASS — contract + config tests run under the node project.

---

## Task 7: Client barrel + provider entry placeholders that compile

> These are **not stubs** — they are the real public surface and entry, implemented to the extent M0 owns them (exports the contract + config; the runtime wiring lands in M1). Each is fully functional for what it claims to do.

**Files:**
- Create: `packages/portal/src/index.ts`
- Modify: `packages/portal/ssr/lib/AppPortal/AppPortalManager.ts`

**Step 1: `src/index.ts`** — real re-export barrel (the package's public entry):
```ts
export * from '../shared/contract'
export { PORTAL_DATA, getPortalData } from './data/PortalData'
// Component/store exports are added by their owning milestones (M1: Portal, etc.)
```

**Step 2: `AppPortalManager.ts`** — the registry is real and usable now (lifecycle suspend/resume wiring is M2; this class fully implements registration/lookup, which is all M0 claims):
```ts
import type { AppPortalConfigEntry } from '../../../shared/contract'
import { REGISTERED_APPS, getApp } from './AppPortalConfig'

/** Registry of guest apps. M0: registration + lookup. M2 adds warm/suspend/resume. */
export class AppPortalManager {
  private readonly apps = new Map<string, AppPortalConfigEntry>()

  constructor(entries: AppPortalConfigEntry[] = REGISTERED_APPS) {
    for (const e of entries) this.apps.set(e.id, e)
  }

  has(id: string): boolean {
    return this.apps.has(id)
  }

  get(id: string): AppPortalConfigEntry | undefined {
    return this.apps.get(id) ?? getApp(id)
  }

  list(): AppPortalConfigEntry[] {
    return [...this.apps.values()]
  }
}
```

**Step 3: Full build gate**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec tsc -b && pnpm exec vitest run --project node
```
→ Expected: `tsc -b` clean (shared+web+node), all node tests PASS.

---

## Done when (M0 gate — all must be green)

```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal
pnpm exec tsc -b            # → 0 errors across shared/web/node
pnpm exec vitest run        # → contract + config tests PASS
pnpm exec eslint .          # → 0 errors
```
- [ ] `AppPortalManager.ts.ts` typo gone.
- [ ] `shared/contract.ts` is the only definition of the boundary types; no duplicate type defs in `src/`/`ssr/`.
- [ ] Allowlist (`AppPortalConfig`) + client mirror (`PortalData`) exist with the 4 example apps (one per kind).
- [ ] Both tsconfig projects reference `shared`; `tsc -b` builds in order.

## TODOs discovered (do NOT fix here)
- OQ-5: replace the four `demo-*` fixtures with the owner's real apps in M4.
- Fixture apps (`ssr/fixtures/demo-static`) are created in M1 when first served.
