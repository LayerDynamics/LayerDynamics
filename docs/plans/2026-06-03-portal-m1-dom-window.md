# Portal M1 — DOM-window MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `lore:execute` to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** Window a registered app running on a *different port* into an R3F scene, **fully interactive in place**, tracked to the portal's projected screen quad — the marquee path, end to end (provider serves/proxies same-origin → client iframe presenter → demo harness).
**Architecture:** The provider (Fastify + `ws`) serves a static build (`APStaticServe`) and reverse-proxies a live app (`APDynamicServe`) onto its **own origin**, and answers negotiation over HTTP (`/config`) + WS (`/portal/:id`). The client `connector` negotiates, then `DomWindowPresenter` mounts a sandboxed iframe to the same-origin URL and, every frame, registers that iframe's CSS rect to the portal mesh's projected screen quad. `PortalEdge`/`PortalFluid` draw the WebGL rim/dormant surface.
**Tech Stack:** Fastify 5, @fastify/http-proxy, @fastify/static, @fastify/cors, ws 8 (provider); R3F 9, drei 10.7, three 0.184, zustand 5 (client).
**Practices:** Contract-first → Typed-first → TDD.
**Required skills:** none.
**Depends on:** M0 (frozen contract, allowlist, package build green).
**Spec:** SPEC-003 §3.2, §3.5 (data flow), FR-1/3/4/5/6/8/10/11/12.

---

## Prerequisites
- M0 gate green (`tsc -b`, node tests, lint).
- Two free local ports for fixtures: `5180` (static), `5181` (dynamic upstream). Provider runs on `5179`.

## Product framing
This milestone proves the hard claim: an external, cross-origin app becomes a live, clickable object *inside* the 3D world. Everything here exists to defeat the cross-origin texture-readback impossibility by routing the guest through the provider's origin and using a real (interactive) iframe registered to the projected quad.

---

## Task 1: Provider bootstrap — Fastify server + route mounting

**Files:**
- Create: `packages/portal/ssr/api/server.ts`
- Create: `packages/portal/ssr/api/app.ts` (buildable Fastify instance, importable by tests)
- Test: `packages/portal/ssr/api/app.test.ts`

**Step 1: Failing test** (`app.test.ts`):
```ts
import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from './app'

const app = buildApp()
afterAll(() => app.close())

describe('provider app', () => {
  it('GET /config lists registered apps as client-mirror entries (no origin leak)', async () => {
    const res = await app.inject({ method: 'GET', url: '/config' })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { apps: Array<{ id: string; origin?: string }> }
    expect(body.apps.map((a) => a.id)).toContain('demo-static')
    expect(body.apps[0].origin).toBeUndefined() // origin/sandbox stay server-side
  })

  it('health check responds', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' })
    expect(res.statusCode).toBe(200)
  })
})
```

**Step 2: Run → FAIL**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vitest run ssr/api/app.test.ts
```

**Step 3: Implement `app.ts`** (the composable instance):
```ts
import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { registerConfigRoute } from './routes/Config'
import { registerStaticRoutes } from './routes/Static'
import { registerDynamicRoutes } from './routes/Dynamic'
import { registerPortalRoutes } from './routes/Portal'
import { registerAppPortalRoutes } from './routes/AppPortal'
import { AppPortalManager } from '../lib/AppPortal/AppPortalManager'

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false })
  const manager = new AppPortalManager()

  // Host origin is the only allowed framer/embedder; tightened in M4.
  app.register(cors, { origin: true, credentials: false })

  app.get('/healthz', async () => ({ ok: true }))

  registerConfigRoute(app, manager)
  registerStaticRoutes(app, manager)
  registerDynamicRoutes(app, manager)
  registerPortalRoutes(app, manager)
  registerAppPortalRoutes(app, manager)

  return app
}
```

**Step 4: Implement `server.ts`** (the runnable entry — real, not a stub):
```ts
import { buildApp } from './app'
import { attachPortalSocket } from '../lib/Portal/PortalServer'

const PORT = Number(process.env.PORTAL_PORT ?? 5179)
const app = buildApp()

// WebSocket control + stream channels live on the same HTTP server.
attachPortalSocket(app.server)

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then((addr) => console.log(`[portal] provider listening on ${addr}`))
  .catch((err) => {
    console.error('[portal] failed to start', err)
    process.exit(1)
  })
```

**Step 5:** Implement the routes referenced above so the build compiles (Tasks 2–5 fill them with real logic — but to keep this task green, implement `Config` now and create the others in their own tasks). For this task, implement **only `Config`** and temporarily import the rest after they exist. Order tasks so `Config` (Task 1) → `Static` (Task 2) → `Dynamic` (Task 3) → `Portal` WS (Task 4) → `AppPortal` (Task 5). Until a route file exists, comment its `register*` line with a `// M1-TaskN` marker and uncomment when implemented (this is sequencing, not stubbing — every line is real by end of M1).

**Step 6: Implement `routes/Config.ts`:**
```ts
import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { ROUTES, type PortalDataEntry } from '../../../shared/contract'

export function registerConfigRoute(app: FastifyInstance, manager: AppPortalManager): void {
  app.get(ROUTES.config, async () => {
    const apps: PortalDataEntry[] = manager.list().map((a) => ({
      id: a.id,
      label: a.label,
      kind: a.kind,
      preferredPresenter: a.preferredPresenter,
      defaultSize: a.defaultSize,
    }))
    return { apps }
  })
}
```

**Step 7: Run → PASS** (after Tasks 2–5 land, the full `app.test.ts` stays green).

---

## Task 2: `APStaticServe` — serve a static build same-origin (TDD)

**Files:**
- Create: `packages/portal/ssr/lib/AppPortal/Static/APStaticServe.ts`
- Create: `packages/portal/ssr/api/routes/Static.ts`
- Create fixture: `packages/portal/ssr/fixtures/demo-static/index.html` (a real tiny interactive app)
- Test: `packages/portal/ssr/lib/AppPortal/Static/APStaticServe.test.ts`

**Step 1: Fixture** (`fixtures/demo-static/index.html`) — a genuinely interactive page so the E2E later asserts real input:
```html
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Demo Static</title>
    <style>body{font:16px system-ui;margin:0;display:grid;place-items:center;height:100vh;background:#111;color:#fff}
    button{font-size:24px;padding:12px 20px}#out{margin-top:16px}</style>
  </head>
  <body>
    <button id="b">clicks: <span id="n">0</span></button>
    <input id="t" placeholder="type here" />
    <div id="out"></div>
    <script>
      let n = 0
      document.getElementById('b').onclick = () => { document.getElementById('n').textContent = String(++n) }
      document.getElementById('t').oninput = (e) => { document.getElementById('out').textContent = e.target.value }
    </script>
  </body>
</html>
```

**Step 2: Failing test:**
```ts
import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../../../api/app'

const app = buildApp()
afterAll(() => app.close())

describe('APStaticServe', () => {
  it('serves a registered static app same-origin', async () => {
    const res = await app.inject({ method: 'GET', url: '/static/demo-static/' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('clicks:')
  })
  it('refuses an unregistered app id (allowlist)', async () => {
    const res = await app.inject({ method: 'GET', url: '/static/evil/' })
    expect(res.statusCode).toBe(403)
  })
})
```

**Step 3: Run → FAIL.**

**Step 4: Implement `APStaticServe.ts`:**
```ts
import type { FastifyInstance } from 'fastify'
import fastifyStatic from '@fastify/static'
import type { AppPortalManager } from '../../AppPortal/AppPortalManager'

/** Mounts @fastify/static for one registered static app under /static/:id/. */
export function serveStatic(app: FastifyInstance, manager: AppPortalManager): void {
  for (const entry of manager.list()) {
    if (entry.serveStrategy !== 'static' || !entry.staticDir) continue
    app.register(fastifyStatic, {
      root: entry.staticDir,
      prefix: `/static/${entry.id}/`,
      decorateReply: false,
    })
  }
}
```

**Step 5: Implement `routes/Static.ts`** (allowlist guard in front of the static mount):
```ts
import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { serveStatic } from '../../lib/AppPortal/Static/APStaticServe'

export function registerStaticRoutes(app: FastifyInstance, manager: AppPortalManager): void {
  // Reject unknown ids before any static handler runs.
  app.addHook('onRequest', async (req, reply) => {
    const m = /^\/static\/([^/]+)\//.exec(req.url)
    if (m && !manager.has(m[1])) {
      reply.code(403).send({ error: 'unregistered app' })
    }
  })
  serveStatic(app, manager)
}
```

**Step 6: Run → PASS.**

---

## Task 3: `APDynamicServe` — reverse-proxy a live app same-origin (TDD)

**Files:**
- Create: `packages/portal/ssr/lib/AppPortal/Dynamic/APDynamicServe.ts`
- Create: `packages/portal/ssr/api/routes/Dynamic.ts`
- Test: `packages/portal/ssr/api/routes/Dynamic.test.ts`

**Step 1: Failing test** (uses a throwaway upstream Fastify on 5181 as the "live app"):
```ts
import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import { buildApp } from '../app'

const upstream = Fastify()
upstream.get('/', async () => '<h1>live app</h1>')
const provider = buildApp()

beforeAll(async () => { await upstream.listen({ port: 5181 }) })
afterAll(async () => { await upstream.close(); await provider.close() })

describe('APDynamicServe', () => {
  it('proxies a registered dynamic app onto the provider origin', async () => {
    const res = await provider.inject({ method: 'GET', url: '/dynamic/demo-dynamic/' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('live app')
  })
  it('refuses unregistered dynamic ids', async () => {
    const res = await provider.inject({ method: 'GET', url: '/dynamic/evil/' })
    expect(res.statusCode).toBe(403)
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `APDynamicServe.ts`** (rewrites framing headers so the provider origin may frame it — R-3 mitigation):
```ts
import type { FastifyInstance } from 'fastify'
import httpProxy from '@fastify/http-proxy'
import type { AppPortalManager } from '../../AppPortal/AppPortalManager'

/** Same-origin reverse proxy per registered dynamic app under /dynamic/:id/. */
export function serveDynamic(app: FastifyInstance, manager: AppPortalManager): void {
  for (const entry of manager.list()) {
    if (entry.serveStrategy !== 'dynamic' || !entry.upstream) continue
    app.register(httpProxy, {
      upstream: entry.upstream,
      prefix: `/dynamic/${entry.id}`,
      rewritePrefix: '/',
      http2: false,
      replyOptions: {
        // Strip framing protections so OUR origin can embed it (allowlisted only).
        rewriteHeaders: (headers) => {
          const h = { ...headers }
          delete h['x-frame-options']
          delete h['content-security-policy']
          if (entry.headers) Object.assign(h, entry.headers)
          return h
        },
      },
    })
  }
}
```

**Step 4: Implement `routes/Dynamic.ts`** (allowlist guard + mount):
```ts
import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { serveDynamic } from '../../lib/AppPortal/Dynamic/APDynamicServe'

export function registerDynamicRoutes(app: FastifyInstance, manager: AppPortalManager): void {
  app.addHook('onRequest', async (req, reply) => {
    const m = /^\/dynamic\/([^/]+)/.exec(req.url)
    if (m && !manager.has(m[1])) reply.code(403).send({ error: 'unregistered app' })
  })
  serveDynamic(app, manager)
}
```

**Step 5: Run → PASS.**

---

## Task 4: Portal WS control channel + negotiation (TDD)

**Files:**
- Create: `packages/portal/ssr/lib/Portal/PortalServer.ts` (WS attach + session)
- Create: `packages/portal/ssr/lib/Portal/PortalDisplay.ts`
- Create: `packages/portal/ssr/lib/Portal/PortalAppConnector.ts` (builds the `TransportDescriptor`)
- Create: `packages/portal/ssr/api/routes/Portal.ts`
- Test: `packages/portal/ssr/lib/Portal/PortalAppConnector.test.ts`

**Step 1: Failing test** (negotiation is pure logic → unit-testable without a socket):
```ts
import { describe, it, expect } from 'vitest'
import { negotiateTransport } from './PortalAppConnector'
import { AppPortalManager } from '../AppPortal/AppPortalManager'

const m = new AppPortalManager()

describe('negotiateTransport', () => {
  it('static → dom-window pointing at the same-origin /static URL', () => {
    const t = negotiateTransport(m, 'demo-static')
    expect(t).toMatchObject({ transport: 'dom-window', url: '/static/demo-static/' })
    expect(t?.sandbox).toContain('allow-scripts')
  })
  it('dynamic → dom-window pointing at the same-origin /dynamic proxy', () => {
    expect(negotiateTransport(m, 'demo-dynamic')?.url).toBe('/dynamic/demo-dynamic/')
  })
  it('stream → texture with a /stream WS endpoint', () => {
    const t = negotiateTransport(m, 'demo-stream')
    expect(t).toMatchObject({ transport: 'texture', streamEndpoint: '/stream/demo-stream' })
  })
  it('native → stencil', () => {
    expect(negotiateTransport(m, 'demo-native')).toMatchObject({ transport: 'stencil', native: true })
  })
  it('unregistered → null (never negotiate an unknown origin)', () => {
    expect(negotiateTransport(m, 'evil')).toBeNull()
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `PortalAppConnector.ts`** (the "always works" mapping):
```ts
import type { AppPortalManager } from '../AppPortal/AppPortalManager'
import { ROUTES, type TransportDescriptor } from '../../../shared/contract'

/** Maps a registered app's kind to a concrete, working TransportDescriptor.
 *  Returns null for unregistered ids (allowlist enforcement at negotiation time). */
export function negotiateTransport(
  manager: AppPortalManager,
  appId: string,
): TransportDescriptor | null {
  const app = manager.get(appId)
  if (!app) return null
  switch (app.serveStrategy) {
    case 'static':
      return { transport: 'dom-window', url: `${ROUTES.static(appId)}/`, sandbox: app.sandbox, dims: pxDims(app.defaultSize) }
    case 'dynamic':
      return { transport: 'dom-window', url: `${ROUTES.dynamic(appId)}/`, sandbox: app.sandbox, dims: pxDims(app.defaultSize) }
    case 'stream':
      return { transport: 'texture', streamEndpoint: ROUTES.stream(appId), dims: pxDims(app.defaultSize) }
    case 'native':
      return { transport: 'stencil', native: true, dims: pxDims(app.defaultSize) }
  }
}

function pxDims([w, h]: [number, number]): [number, number] {
  // World units → a sensible intrinsic pixel size (≈ 426 px / world unit).
  return [Math.round(w * 426), Math.round(h * 426)]
}
```

**Step 4: Implement `PortalDisplay.ts`** (what a session currently shows):
```ts
import type { PortalState, TransportDescriptor } from '../../../shared/contract'

export class PortalDisplay {
  state: PortalState = 'dormant'
  transport: TransportDescriptor | null = null
  constructor(public readonly portalId: string, public readonly appId: string) {}
  setTransport(t: TransportDescriptor): void { this.transport = t }
  setState(s: PortalState): void { this.state = s }
}
```

**Step 5: Implement `PortalServer.ts`** (real `ws` server bound to the HTTP server; validates every message via the contract guard):
```ts
import { WebSocketServer, type WebSocket } from 'ws'
import type { Server } from 'node:http'
import { isPortalMessage, type PortalMessage } from '../../../shared/contract'
import { AppPortalManager } from '../AppPortal/AppPortalManager'
import { negotiateTransport } from './PortalAppConnector'
import { PortalDisplay } from './PortalDisplay'

const manager = new AppPortalManager()
const sessions = new Map<string, PortalDisplay>()

export function attachPortalSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: undefined })
  wss.on('connection', (ws, req) => {
    if (!req.url?.startsWith('/portal/')) { ws.close(1008, 'bad path'); return }
    ws.on('message', (raw) => handle(ws, raw.toString()))
  })
  return wss
}

function handle(ws: WebSocket, raw: string): void {
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return }
  if (!isPortalMessage(parsed)) { return } // drop malformed (security)
  const msg = parsed as PortalMessage
  switch (msg.type) {
    case 'negotiate': {
      const transport = negotiateTransport(manager, msg.appId)
      if (!transport) { send(ws, { type: 'error', portalId: msg.portalId, message: 'unregistered app' }); return }
      const display = new PortalDisplay(msg.portalId, msg.appId)
      display.setTransport(transport)
      sessions.set(msg.portalId, display)
      ws.send(JSON.stringify({ type: 'transport', portalId: msg.portalId, transport }))
      break
    }
    case 'warm':
    case 'engaged': {
      sessions.get(msg.portalId)?.setState('live')
      send(ws, { type: 'state', portalId: msg.portalId, state: 'live' })
      break
    }
    case 'idle': {
      sessions.get(msg.portalId)?.setState('idle')
      send(ws, { type: 'state', portalId: msg.portalId, state: 'idle' })
      break
    }
    case 'dispose': {
      sessions.delete(msg.portalId)
      break
    }
    default:
      break // 'input' handled in M3; others are host-bound
  }
}

function send(ws: WebSocket, msg: PortalMessage): void {
  ws.send(JSON.stringify(msg))
}
```
> Note: `warm/engaged/idle` here just track state; real guest suspend/resume is M2 (`AppPortalManager` lifecycle). M1 needs the channel working end-to-end, which this delivers.

**Step 6: Implement `routes/Portal.ts`** (HTTP fallback negotiation so the client can negotiate without WS in tests/SSR):
```ts
import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { negotiateTransport } from '../../lib/Portal/PortalAppConnector'

export function registerPortalRoutes(app: FastifyInstance, manager: AppPortalManager): void {
  app.get<{ Params: { id: string }; Querystring: { app?: string } }>(
    '/portal/:id',
    async (req, reply) => {
      const appId = req.query.app
      if (!appId) return reply.code(400).send({ error: 'missing app' })
      const transport = negotiateTransport(manager, appId)
      if (!transport) return reply.code(403).send({ error: 'unregistered app' })
      return { portalId: req.params.id, transport }
    },
  )
}
```

**Step 7: Run → PASS.**

---

## Task 5: `AppPortal` management routes (TDD)

**Files:**
- Create: `packages/portal/ssr/lib/AppPortal/AppServer.ts`
- Create: `packages/portal/ssr/lib/AppPortal/AppPortalRoutes.ts`
- Create: `packages/portal/ssr/api/routes/AppPortal.ts`
- Test: `packages/portal/ssr/api/routes/AppPortal.test.ts`

**Step 1: Failing test:**
```ts
import { describe, it, expect, afterAll } from 'vitest'
import { buildApp } from '../app'
const app = buildApp()
afterAll(() => app.close())

describe('AppPortal routes', () => {
  it('warm returns the resolved transport for a registered app', async () => {
    const res = await app.inject({ method: 'POST', url: '/app-portal/demo-static/warm' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'warming', transport: { transport: 'dom-window' } })
  })
  it('rejects unregistered ids', async () => {
    const res = await app.inject({ method: 'POST', url: '/app-portal/evil/warm' })
    expect(res.statusCode).toBe(403)
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `AppServer.ts`** (M1: serving/proxying is handled by Static/Dynamic; this owns per-app readiness — fully real for what M1 needs, lifecycle suspend added in M2):
```ts
import type { AppPortalConfigEntry } from '../../../shared/contract'

/** Represents one guest app's serve session. M1: reachability + descriptor.
 *  M2 extends with spawn/suspend/resume. */
export class AppServer {
  status: 'idle' | 'warming' | 'running' | 'errored' = 'idle'
  constructor(public readonly entry: AppPortalConfigEntry) {}
  warm(): void { this.status = this.status === 'running' ? 'running' : 'warming' }
  markRunning(): void { this.status = 'running' }
}
```

**Step 4: Implement `AppPortalRoutes.ts` + `routes/AppPortal.ts`:**
```ts
// AppPortalRoutes.ts
import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from './AppPortalManager'
import { negotiateTransport } from '../Portal/PortalAppConnector'

export function registerAppPortal(app: FastifyInstance, manager: AppPortalManager): void {
  app.post<{ Params: { appId: string; action: 'warm' | 'suspend' | 'dispose' } }>(
    '/app-portal/:appId/:action',
    async (req, reply) => {
      const { appId, action } = req.params
      if (!manager.has(appId)) return reply.code(403).send({ error: 'unregistered app' })
      if (action === 'warm') {
        return { status: 'warming', transport: negotiateTransport(manager, appId) }
      }
      // suspend/dispose state changes are wired to AppPortalManager lifecycle in M2.
      return { status: action === 'suspend' ? 'idle' : 'disposed' }
    },
  )
}
```
```ts
// routes/AppPortal.ts
import type { FastifyInstance } from 'fastify'
import type { AppPortalManager } from '../../lib/AppPortal/AppPortalManager'
import { registerAppPortal } from '../../lib/AppPortal/AppPortalRoutes'
export function registerAppPortalRoutes(app: FastifyInstance, manager: AppPortalManager): void {
  registerAppPortal(app, manager)
}
```

**Step 5: Run → PASS.** Then re-run the full provider suite:
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vitest run --project node
```
→ Expected: all provider tests PASS; `app.test.ts` (Task 1) now green with all routes mounted.

---

## Task 6: Client io — connector + PortalClient (TDD)

**Files:**
- Create: `packages/portal/src/io/PortalClient.ts`
- Create: `packages/portal/src/io/connector.ts`
- Create: `packages/portal/src/io/AppClient.ts`
- Test: `packages/portal/src/io/connector.unit.test.ts`

**Step 1: Failing test** (HTTP negotiation path; `fetch` mocked to the provider shape):
```ts
import { describe, it, expect, vi } from 'vitest'
import { negotiate } from './connector'

describe('connector.negotiate', () => {
  it('resolves a TransportDescriptor from the provider /portal endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ portalId: 'p1', transport: { transport: 'dom-window', url: '/static/demo-static/', sandbox: ['allow-scripts'] } }),
      { status: 200 },
    )))
    const t = await negotiate('http://localhost:5179', 'p1', 'demo-static')
    expect(t?.transport).toBe('dom-window')
    expect(t?.url).toBe('/static/demo-static/')
  })
  it('returns null on a 403 (unregistered)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 403 })))
    expect(await negotiate('http://localhost:5179', 'p1', 'evil')).toBeNull()
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `connector.ts`:**
```ts
import type { TransportDescriptor } from '../../shared/contract'

/** HTTP negotiation: ask the provider how to present `appId`. Returns null if the
 *  provider refuses (unregistered) — caller shows the dormant placeholder. */
export async function negotiate(
  providerOrigin: string,
  portalId: string,
  appId: string,
): Promise<TransportDescriptor | null> {
  const url = `${providerOrigin}/portal/${encodeURIComponent(portalId)}?app=${encodeURIComponent(appId)}`
  const res = await fetch(url)
  if (!res.ok) return null
  const body = (await res.json()) as { transport: TransportDescriptor }
  return body.transport
}

/** Resolve a same-origin (provider-relative) transport URL to an absolute one. */
export function resolveUrl(providerOrigin: string, t: TransportDescriptor): string | undefined {
  return t.url ? new URL(t.url, providerOrigin).toString() : undefined
}
```

**Step 4: Implement `PortalClient.ts`** (WS control channel with reconnect/backoff — real implementation):
```ts
import { isPortalMessage, type PortalMessage } from '../../shared/contract'

type Listener = (msg: PortalMessage) => void

/** Host→provider control channel over WS, with exponential-backoff reconnect. */
export class PortalClient {
  private ws: WebSocket | null = null
  private readonly listeners = new Set<Listener>()
  private backoff = 250
  private disposed = false

  constructor(private readonly providerOrigin: string, private readonly portalId: string) {}

  connect(): void {
    if (this.disposed) return
    const wsUrl = this.providerOrigin.replace(/^http/, 'ws') + `/portal/${this.portalId}`
    const ws = new WebSocket(wsUrl)
    this.ws = ws
    ws.onopen = () => { this.backoff = 250 }
    ws.onmessage = (e) => {
      let parsed: unknown
      try { parsed = JSON.parse(e.data as string) } catch { return }
      if (isPortalMessage(parsed)) for (const l of this.listeners) l(parsed)
    }
    ws.onclose = () => {
      if (this.disposed) return
      this.backoff = Math.min(this.backoff * 2, 5000)
      setTimeout(() => this.connect(), this.backoff)
    }
  }

  send(msg: PortalMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg))
  }
  on(l: Listener): () => void { this.listeners.add(l); return () => this.listeners.delete(l) }
  dispose(): void { this.disposed = true; this.ws?.close() }
}
```

**Step 5: Implement `AppClient.ts`** (host-side handle to one guest iframe — typed postMessage with origin check):
```ts
/** Handle to one windowed guest iframe. Typed, origin-checked postMessage. */
export class AppClient {
  constructor(
    private readonly frame: HTMLIFrameElement,
    private readonly guestOrigin: string,
  ) {}
  post(message: unknown): void {
    this.frame.contentWindow?.postMessage(message, this.guestOrigin)
  }
  onMessage(handler: (data: unknown) => void): () => void {
    const fn = (e: MessageEvent) => { if (e.origin === this.guestOrigin) handler(e.data) }
    window.addEventListener('message', fn)
    return () => window.removeEventListener('message', fn)
  }
}
```

**Step 6: Run → PASS** (`connector.unit.test.ts`).

---

## Task 7: Zustand stores + hooks (TDD)

**Files:**
- Create: `packages/portal/src/stores/{config,connectorStore,portalStore,appStore}.ts`
- Create: `packages/portal/src/hooks/{useConfigStore,useConnectorStore,usePortalStore,useAppStore,useAppPortal}.ts`
- Test: `packages/portal/src/stores/portalStore.unit.test.ts`

**Step 1: Failing test:**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePortalStore } from './portalStore'

beforeEach(() => usePortalStore.getState().reset())

describe('portalStore', () => {
  it('registers a portal as dormant and transitions state', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    expect(usePortalStore.getState().portals['p1'].state).toBe('dormant')
    s.setState('p1', 'live')
    expect(usePortalStore.getState().portals['p1'].state).toBe('live')
  })
  it('updates the projected quad', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.setQuad('p1', { x: 10, y: 20, w: 100, h: 60, visible: true })
    expect(usePortalStore.getState().portals['p1'].quad?.w).toBe(100)
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `portalStore.ts`:**
```ts
import { create } from 'zustand'
import type { PortalState, TransportDescriptor } from '../../shared/contract'

export interface ScreenQuad { x: number; y: number; w: number; h: number; visible: boolean }
export interface PortalInstance {
  id: string
  appId: string
  state: PortalState
  engaged: boolean
  transport: TransportDescriptor | null
  quad: ScreenQuad | null
}
interface PortalStore {
  portals: Record<string, PortalInstance>
  register(id: string, appId: string): void
  setState(id: string, state: PortalState): void
  setTransport(id: string, t: TransportDescriptor): void
  setQuad(id: string, quad: ScreenQuad): void
  setEngaged(id: string, engaged: boolean): void
  remove(id: string): void
  reset(): void
}
export const usePortalStore = create<PortalStore>((set) => ({
  portals: {},
  register: (id, appId) => set((st) => ({
    portals: { ...st.portals, [id]: { id, appId, state: 'dormant', engaged: false, transport: null, quad: null } },
  })),
  setState: (id, state) => set((st) => st.portals[id] ? ({ portals: { ...st.portals, [id]: { ...st.portals[id], state } } }) : st),
  setTransport: (id, transport) => set((st) => st.portals[id] ? ({ portals: { ...st.portals, [id]: { ...st.portals[id], transport } } }) : st),
  setQuad: (id, quad) => set((st) => st.portals[id] ? ({ portals: { ...st.portals, [id]: { ...st.portals[id], quad } } }) : st),
  setEngaged: (id, engaged) => set((st) => st.portals[id] ? ({ portals: { ...st.portals, [id]: { ...st.portals[id], engaged } } }) : st),
  remove: (id) => set((st) => { const p = { ...st.portals }; delete p[id]; return { portals: p } }),
  reset: () => set({ portals: {} }),
}))
```

**Step 4: Implement the remaining stores + hooks** (each small and real):
- `config.ts` — holds `providerOrigin` + loaded `PortalDataEntry[]` (from `/config`), with a `load(origin)` action that fetches and stores.
- `connectorStore.ts` — per-portal connection status (`connecting|open|closed|error`).
- `appStore.ts` — per-guest readiness/error/lastFrame.
- Hooks `useConfigStore`/`useConnectorStore`/`usePortalStore`/`useAppStore` are selector wrappers; `useAppPortal(id, appId, origin)` is the orchestration hook: on mount `register` → `negotiate` → `setTransport`; exposes `engage()`/`idle()` that call `PortalClient.send`. Full code follows the same shape as `portalStore` above.

**Step 5: Run → PASS.**

---

## Task 8: `DomWindowPresenter` + projected-quad sync (TDD, browser)

**Files:**
- Create: `packages/portal/src/components/presenters/DomWindowPresenter.tsx`
- Create: `packages/portal/src/components/lib/projectQuad.ts`
- Test (unit): `packages/portal/src/components/lib/projectQuad.unit.test.ts`
- Test (browser): `packages/portal/src/components/presenters/DomWindowPresenter.browser.test.tsx`

**Step 1: Failing unit test for the projection math:**
```ts
import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { projectQuad } from './projectQuad'

describe('projectQuad', () => {
  it('projects a plane centered in front of the camera to the viewport center', () => {
    const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    cam.position.set(0, 0, 5); cam.lookAt(0, 0, 0); cam.updateMatrixWorld()
    const q = projectQuad({ width: 2, height: 2 }, new THREE.Matrix4().identity(), cam, 800, 800)
    expect(Math.abs(q.x + q.w / 2 - 400)).toBeLessThan(2) // center x ≈ 400
    expect(q.visible).toBe(true)
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `projectQuad.ts`** (world quad → CSS screen rect):
```ts
import * as THREE from 'three'

export interface QuadResult { x: number; y: number; w: number; h: number; visible: boolean }
const CORNERS = [
  new THREE.Vector3(-0.5, -0.5, 0), new THREE.Vector3(0.5, -0.5, 0),
  new THREE.Vector3(0.5, 0.5, 0), new THREE.Vector3(-0.5, 0.5, 0),
]

/** Project a w×h plane (given its world matrix) to a screen-space bounding rect.
 *  Returns visible=false when the plane is behind the camera or off-screen. */
export function projectQuad(
  size: { width: number; height: number },
  world: THREE.Matrix4,
  camera: THREE.Camera,
  vw: number,
  vh: number,
): QuadResult {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  let anyInFront = false
  const v = new THREE.Vector3()
  for (const c of CORNERS) {
    v.set(c.x * size.width, c.y * size.height, 0).applyMatrix4(world).project(camera)
    if (v.z < 1) anyInFront = true
    const sx = (v.x * 0.5 + 0.5) * vw
    const sy = (-v.y * 0.5 + 0.5) * vh
    minX = Math.min(minX, sx); maxX = Math.max(maxX, sx)
    minY = Math.min(minY, sy); maxY = Math.max(maxY, sy)
  }
  const visible = anyInFront && maxX > 0 && minX < vw && maxY > 0 && minY < vh
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, visible }
}
```

**Step 4: Implement `DomWindowPresenter.tsx`** (the interactive iframe registered to the quad each frame):
```tsx
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { TransportDescriptor } from '../../../shared/contract'
import { projectQuad } from '../lib/projectQuad'

interface Props {
  transport: TransportDescriptor
  providerOrigin: string
  width: number
  height: number
  /** World matrix source: the portal mesh ref. */
  meshRef: React.RefObject<THREE.Object3D | null>
  onState?: (visible: boolean) => void
}

/** Renders the guest as a real, interactive iframe positioned over the canvas,
 *  its CSS rect synced every frame to the portal's projected screen quad.
 *  This is what makes a cross-origin app "fully interactive in place". */
export function DomWindowPresenter({ transport, providerOrigin, width, height, meshRef, onState }: Props) {
  const { gl, camera, size } = useThree()
  const elRef = useRef<HTMLIFrameElement | null>(null)

  const url = useMemo(
    () => (transport.url ? new URL(transport.url, providerOrigin).toString() : ''),
    [transport.url, providerOrigin],
  )

  useEffect(() => {
    const parent = gl.domElement.parentElement
    if (!parent) return
    const iframe = document.createElement('iframe')
    iframe.src = url
    iframe.sandbox.value = (transport.sandbox ?? []).join(' ')
    iframe.style.cssText =
      'position:absolute;top:0;left:0;border:0;transform-origin:top left;pointer-events:auto;background:transparent'
    parent.appendChild(iframe)
    elRef.current = iframe
    return () => { iframe.remove(); elRef.current = null }
  }, [url, transport.sandbox, gl])

  useFrame(() => {
    const iframe = elRef.current
    const mesh = meshRef.current
    if (!iframe || !mesh) return
    mesh.updateWorldMatrix(true, false)
    const q = projectQuad({ width, height }, mesh.matrixWorld, camera, size.width, size.height)
    onState?.(q.visible)
    if (!q.visible || q.w <= 0 || q.h <= 0) { iframe.style.display = 'none'; return }
    iframe.style.display = 'block'
    const dims = transport.dims ?? [q.w, q.h]
    iframe.width = String(dims[0]); iframe.height = String(dims[1])
    // Scale the intrinsic-sized iframe to the projected quad → crisp + correct hit area.
    const sx = q.w / dims[0], sy = q.h / dims[1]
    iframe.style.transform = `translate(${q.x}px,${q.y}px) scale(${sx},${sy})`
  })

  return null
}
```
> Trade-off honored from SPEC FR-8/FR-9: this is an axis-aligned bounding-rect registration — exact for near-planar, camera-facing portals (M1's interactive contract). Oblique/curved handling (CSS3D matrix or texture fallback) is M3.

**Step 5: Browser test** (`DomWindowPresenter.browser.test.tsx`) — mounts in a real R3F canvas, asserts an iframe appears and tracks:
```tsx
import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { DomWindowPresenter } from './DomWindowPresenter'

function Harness() {
  const ref = useRef<THREE.Mesh>(null)
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <mesh ref={ref}><planeGeometry args={[2, 2]} /><meshBasicMaterial /></mesh>
      <DomWindowPresenter
        transport={{ transport: 'dom-window', url: 'about:blank', sandbox: ['allow-scripts'], dims: [800, 600] }}
        providerOrigin="http://localhost:5179" width={2} height={2} meshRef={ref}
      />
    </Canvas>
  )
}

describe('DomWindowPresenter', () => {
  it('mounts an iframe sibling to the canvas and positions it', async () => {
    const { container } = render(<Harness />)
    await new Promise((r) => setTimeout(r, 100))
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeTruthy()
    expect(iframe!.style.transform).toContain('translate')
  })
})
```

**Step 6: Run both → PASS**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vitest run --project node src/components/lib/projectQuad.unit.test.ts && pnpm exec vitest run --project browser
```

---

## Task 9: `Portal`, `PortalEdge`, `PortalFluid` components (browser smoke)

**Files:**
- Create: `packages/portal/src/components/Portal.tsx`
- Create: `packages/portal/src/components/PortalEdge.tsx`
- Create: `packages/portal/src/components/PortalFluid.tsx`
- Test: `packages/portal/src/components/Portal.browser.test.tsx`

**Step 1: Failing smoke test:**
```tsx
import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { Portal } from './Portal'

describe('Portal', () => {
  it('smoke-mounts a dormant portal without throwing', async () => {
    const { container } = render(
      <Canvas><Portal app="demo-static" providerOrigin="http://localhost:5179" position={[0, 0, 0]} /></Canvas>,
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(container.querySelector('canvas')).toBeTruthy()
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `PortalEdge.tsx`** (brand coral rim via a ring + emissive material — real, uses the repo's coral `#ff6750`):
```tsx
import { useMemo } from 'react'
import * as THREE from 'three'

export function PortalEdge({ width, height, intensity = 1 }: { width: number; height: number; intensity?: number }) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape()
    const w = width / 2, h = height / 2
    shape.moveTo(-w, -h); shape.lineTo(w, -h); shape.lineTo(w, h); shape.lineTo(-w, h); shape.lineTo(-w, -h)
    const hole = new THREE.Path()
    const iw = w - 0.06, ih = h - 0.06
    hole.moveTo(-iw, -ih); hole.lineTo(iw, -ih); hole.lineTo(iw, ih); hole.lineTo(-iw, ih); hole.lineTo(-iw, -ih)
    shape.holes.push(hole)
    return new THREE.ShapeGeometry(shape)
  }, [width, height])
  return (
    <mesh geometry={geom} position={[0, 0, 0.001]}>
      <meshStandardMaterial color="#ff6750" emissive="#ff6750" emissiveIntensity={intensity} toneMapped={false} />
    </mesh>
  )
}
```

**Step 4: Implement `PortalFluid.tsx`** (the dormant "another world" surface — a real shader, cheap, animated):
```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertex = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `
const fragment = /* glsl */ `
  varying vec2 vUv; uniform float uTime;
  void main(){
    vec2 p = vUv*2.0-1.0;
    float r = length(p);
    float swirl = sin(8.0*r - uTime*1.5 + atan(p.y,p.x)*3.0);
    vec3 col = mix(vec3(0.02), vec3(1.0,0.404,0.314), 0.5+0.5*swirl);
    gl_FragColor = vec4(col*(1.0-r*0.6), 1.0);
  }`

export function PortalFluid({ width, height }: { width: number; height: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  useFrame((_, dt) => { if (mat.current) mat.current.uniforms.uTime.value += dt })
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment}
        uniforms={{ uTime: { value: 0 } }} />
    </mesh>
  )
}
```

**Step 5: Implement `Portal.tsx`** (the public component — orchestrates via `useAppPortal`, swaps fluid↔presenter by state):
```tsx
import { useRef } from 'react'
import * as THREE from 'three'
import { useAppPortal } from '../hooks/useAppPortal'
import { getPortalData } from '../data/PortalData'
import { PortalEdge } from './PortalEdge'
import { PortalFluid } from './PortalFluid'
import { DomWindowPresenter } from './presenters/DomWindowPresenter'

interface Props {
  app: string
  providerOrigin: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  size?: [number, number]
}

export function Portal({ app, providerOrigin, position = [0, 0, 0], rotation = [0, 0, 0], size }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const data = getPortalData(app)
  const [w, h] = size ?? data?.defaultSize ?? [2, 2]
  const { state, transport, engage } = useAppPortal(app, providerOrigin)

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} onClick={engage}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <PortalEdge width={w} height={h} intensity={state === 'live' ? 1.6 : 1} />
      {state !== 'live' && <PortalFluid width={w} height={h} />}
      {state === 'live' && transport?.transport === 'dom-window' && (
        <DomWindowPresenter
          transport={transport} providerOrigin={providerOrigin}
          width={w} height={h} meshRef={meshRef}
        />
      )}
    </group>
  )
}
```
> `useAppPortal` (M1 Task 7) here drives negotiate-on-mount and exposes `engage()` which flips to `live` and mounts the presenter. Texture/stencil branches are added in M3.

**Step 6: Export from barrel** — add to `src/index.ts`:
```ts
export { Portal } from './components/Portal'
export { usePortalStore } from './stores/portalStore'
```

**Step 7: Run → PASS.**

---

## Task 10: Demo harness + manual verification

**Files:**
- Modify: `packages/portal/index.html`, `packages/portal/src/main.tsx`, `packages/portal/src/App.tsx`, `packages/portal/src/components/Layout.tsx`
- Create: `packages/portal/vite.config.ts`

**Step 1: `vite.config.ts`** (React plugin; proxy `/static`,`/dynamic`,`/portal`,`/config` to the provider so the iframe is same-origin in dev):
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    proxy: {
      '/static': 'http://localhost:5179',
      '/dynamic': 'http://localhost:5179',
      '/config': 'http://localhost:5179',
      '/portal': { target: 'ws://localhost:5179', ws: true },
    },
  },
})
```

**Step 2: `App.tsx`** — a real scene placing one DOM-window portal:
```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Portal } from './components/Portal'

export default function App() {
  // Same-origin in dev via the Vite proxy → iframe is interactive + untainted.
  const origin = window.location.origin
  return (
    <Canvas camera={{ position: [0, 0, 6] }} style={{ position: 'fixed', inset: 0 }}>
      <ambientLight intensity={0.8} />
      <Portal app="demo-static" providerOrigin={origin} position={[-2, 0, 0]} />
      <Portal app="demo-dynamic" providerOrigin={origin} position={[2, 0, 0]} />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
```

**Step 3:** Wire `main.tsx` (mount `<App/>`), `index.html` (root div + script), `Layout.tsx` (the fixed full-bleed wrapper). All real.

**Step 4: Manual end-to-end verification** (the marquee proof — run all three):
```bash
# terminal 1: provider
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm dev:server
# terminal 2: a real "live app" upstream on 5181 for demo-dynamic
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm exec vite preview --port 5181 --outDir ssr/fixtures/demo-static
# terminal 3: harness
cd /Users/ryanoboyle/LayerDynamics/packages/portal && pnpm dev:client
```
Open `http://localhost:5183`, click a portal → it goes `live`, the static app appears inside the rim, and **clicking the button / typing in the input works** while orbiting the camera (rect tracks). Capture a screenshot per the verification-rig memory if doing headless QA.

> Manual verification is required because true interactive-iframe-in-3D behavior can't be fully asserted headlessly; the browser smoke test (Task 8/9) covers mount+track, this covers real input. A real automated E2E lands in M4.

---

## Done when (M1 gate)
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal
pnpm exec tsc -b          # 0 errors
pnpm exec vitest run      # node + browser tests PASS
pnpm exec eslint .        # 0 errors
```
- [ ] `/config` lists apps without leaking `origin`/`sandbox`.
- [ ] Static app served same-origin; dynamic app proxied same-origin; unregistered ids → 403 (tested).
- [ ] Negotiation maps each kind to a `TransportDescriptor` (tested), unregistered → null/403.
- [ ] `DomWindowPresenter` mounts an iframe and tracks the projected quad (browser test).
- [ ] Manual: a registered app on a different port is clickable/typeable inside the 3D scene.

## TODOs discovered (do NOT fix here)
- Oblique/curved portal accuracy → M3 (CSS3D matrix or texture fallback).
- Real automated E2E (full stack, no mocks) → M4.
- `warm/idle` currently only flip state; guest suspend/resume → M2.
