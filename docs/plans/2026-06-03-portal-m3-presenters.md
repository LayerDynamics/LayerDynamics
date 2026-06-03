# Portal M3 — Texture & Stencil Presenters ("always works") Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `lore:execute` to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** Complete the "always works no matter the situation" contract by adding the two remaining presenters — `TexturePresenter` (socket-streamed app → `WebGLRenderTarget` via ImageBitmap-over-WS, with forwarded input) and `StencilPresenter` (three.js-native world via drei `MeshPortalMaterial`) — plus presenter **fallthrough** so a portal is never blank.
**Architecture:** The provider's `APSocketStream` (a `ws` endpoint per streamed app) pushes encoded `ImageBitmap` frames; the client `TexturePresenter` decodes them onto a texture mapped to the aperture mesh and forwards normalized pointer/key events back over the same socket (FR-9). `StencilPresenter` renders a native R3F scene through drei's portal material — no DOM, no provider round-trip. `Portal.tsx` selects the presenter from the negotiated `transport`, falling through `dom-window → texture → poster` on failure.
**Tech Stack:** ws 8 + node `ImageBitmap`/canvas capture (provider); R3F 9 + drei 10.7 `MeshPortalMaterial` + three `WebGLRenderTarget`/`CanvasTexture` (client).
**Practices:** Contract-first → Typed-first → TDD.
**Required skills:** none.
**Depends on:** M2 (lifecycle gating — texture/stream guests must obey engage/idle).
**Spec:** SPEC-003 FR-2/3/9, §3.5 (stream/native branches), OQ-4 (resolved: ImageBitmap-over-WS).

---

## Prerequisites
- M2 gate green.
- Decision (OQ-4) locked: **ImageBitmap frames over the existing `ws` channel.** A streamed guest app captures its own canvas/DOM to bitmaps and sends them; the host decodes to a texture.

## Product framing
M1/M2 cover apps that can be iframed same-origin. M3 covers the two that can't: a **streamed** app (rendered elsewhere, only frames arrive — needs RTT + input forwarding) and a **native three.js world** (rendered in-engine through a stencil portal — the literal "window into another world"). With these, all four `AppKind`s present a working view.

---

## Task 1: Stream protocol on the contract (contract-first, TDD)

**Files:**
- Modify: `packages/portal/shared/contract.ts` (add frame/stream message types)
- Test: `packages/portal/shared/contract.stream.test.ts`

**Step 1: Failing test:**
```ts
import { describe, it, expect } from 'vitest'
import { isStreamFrame, type StreamFrameMeta } from './contract'

describe('stream frame contract', () => {
  it('validates a frame-meta header', () => {
    const meta: StreamFrameMeta = { type: 'frame', portalId: 'p1', w: 800, h: 600, seq: 3 }
    expect(isStreamFrame(meta)).toBe(true)
    expect(isStreamFrame({ type: 'frame' })).toBe(false)
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Add to `contract.ts`:**
```ts
/** Stream frame header (sent as JSON, immediately followed by a binary bitmap blob). */
export interface StreamFrameMeta {
  type: 'frame'
  portalId: string
  w: number
  h: number
  seq: number
}
export function isStreamFrame(v: unknown): v is StreamFrameMeta {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return o.type === 'frame' &&
    typeof o.portalId === 'string' &&
    typeof o.w === 'number' && typeof o.h === 'number' && typeof o.seq === 'number'
}
```

**Step 4: Run → PASS.** Re-run M0 contract test to confirm no regression.

---

## Task 2: `APSocketStream` provider endpoint (TDD)

**Files:**
- Create: `packages/portal/ssr/lib/AppPortal/Stream/APSocketStream.ts`
- Create: `packages/portal/ssr/api/routes/Stream.ts`
- Modify: `packages/portal/ssr/lib/Portal/PortalServer.ts` (attach the stream WSS)
- Test: `packages/portal/ssr/lib/AppPortal/Stream/APSocketStream.test.ts`

**Step 1: Failing test** (a `ws` client connects to `/stream/demo-stream`, receives a frame header + binary; unregistered id rejected):
```ts
import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import { createServer } from 'node:http'
import { WebSocket } from 'ws'
import { attachStreamSocket } from './APSocketStream'
import { AppPortalManager } from '../../AppPortal/AppPortalManager'

const http = createServer()
beforeAll(() => new Promise<void>((r) => { attachStreamSocket(http, new AppPortalManager()); http.listen(5188, r) }))
afterAll(() => new Promise<void>((r) => http.close(() => r())))

describe('APSocketStream', () => {
  it('accepts a registered stream id and relays a frame', async () => {
    const producer = new WebSocket('ws://localhost:5188/stream/demo-stream?role=producer')
    const consumer = new WebSocket('ws://localhost:5188/stream/demo-stream?role=consumer')
    await Promise.all([once(producer, 'open'), once(consumer, 'open')])
    const got = new Promise((res) => consumer.on('message', res))
    producer.send(JSON.stringify({ type: 'frame', portalId: 'p1', w: 4, h: 4, seq: 1 }))
    expect(await got).toBeDefined()
    producer.close(); consumer.close()
  })
  it('rejects an unregistered stream id', async () => {
    const ws = new WebSocket('ws://localhost:5188/stream/evil')
    const code = await new Promise((res) => ws.on('close', res))
    expect(code).toBe(1008)
  })
})
function once(ws: WebSocket, ev: string) { return new Promise((r) => ws.once(ev, r)) }
```

**Step 2: Run → FAIL.**

**Step 3: Implement `APSocketStream.ts`** (relays producer→consumer frames per portal; allowlist-gated):
```ts
import { WebSocketServer, type WebSocket } from 'ws'
import type { Server } from 'node:http'
import type { AppPortalManager } from '../../AppPortal/AppPortalManager'

interface Room { producers: Set<WebSocket>; consumers: Set<WebSocket> }
const rooms = new Map<string, Room>()

/** WS relay: a streamed guest (producer) pushes frames; hosts (consumers) receive
 *  them. One room per appId. Allowlist enforced at connect time. */
export function attachStreamSocket(server: Server, manager: AppPortalManager): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true })
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', 'http://x')
    const m = /^\/stream\/([^/]+)$/.exec(url.pathname)
    if (!m) return
    const appId = m[1]
    if (!manager.has(appId)) { socket.write('HTTP/1.1 400\r\n\r\n'); socket.destroy(); return }
    wss.handleUpgrade(req, socket, head, (ws) => join(ws, appId, url.searchParams.get('role') ?? 'consumer'))
  })
  // Reject unregistered explicitly with 1008 for the test/observability.
  wss.on('headers', () => {})
  return wss
}

function room(appId: string): Room {
  let r = rooms.get(appId); if (!r) { r = { producers: new Set(), consumers: new Set() }; rooms.set(appId, r) }
  return r
}
function join(ws: WebSocket, appId: string, role: string): void {
  const r = room(appId)
  const set = role === 'producer' ? r.producers : r.consumers
  set.add(ws)
  ws.on('close', () => set.delete(ws))
  if (role === 'producer') {
    ws.on('message', (data, isBinary) => { for (const c of r.consumers) if (c.readyState === c.OPEN) c.send(data, { binary: isBinary }) })
  } else {
    // consumer → forward input events to producers
    ws.on('message', (data) => { for (const p of r.producers) if (p.readyState === p.OPEN) p.send(data) })
  }
}
```
> The unregistered-close-with-1008 assertion: in `attachStreamSocket`, when `manager.has` is false and a non-upgradable request hits the route, return 1008 on the close. For the explicit `ws://.../stream/evil` no-`role` case, destroy with a close frame. (Implement the 1008 path in the upgrade handler by completing the handshake then `ws.close(1008)` for cleaner client semantics — adjust to make the test green.)

**Step 4: Implement `routes/Stream.ts`** (HTTP info endpoint + register the WSS in `server.ts`/`PortalServer`). Wire `attachStreamSocket(app.server, manager)` alongside `attachPortalSocket`.

**Step 5: Run → PASS.**

---

## Task 3: `TexturePresenter` — frames → texture (TDD, browser)

**Files:**
- Create: `packages/portal/src/components/presenters/TexturePresenter.tsx`
- Create: `packages/portal/src/io/StreamClient.ts`
- Test (unit): `packages/portal/src/io/StreamClient.unit.test.ts`
- Test (browser): `packages/portal/src/components/presenters/TexturePresenter.browser.test.tsx`

**Step 1: Failing unit test for `StreamClient`** (decodes a header+blob pair into a frame):
```ts
import { describe, it, expect, vi } from 'vitest'
import { StreamClient } from './StreamClient'

describe('StreamClient', () => {
  it('pairs a JSON frame-meta with the following binary blob and emits a frame', async () => {
    const client = new StreamClient('ws://x/stream/demo-stream', 'p1')
    const frames: unknown[] = []
    client.onFrame((f) => frames.push(f))
    client.handleMessage(JSON.stringify({ type: 'frame', portalId: 'p1', w: 2, h: 2, seq: 1 }))
    await client.handleMessage(new Blob([new Uint8Array([255, 0, 0, 255])]))
    expect(frames.length).toBe(1)
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `StreamClient.ts`** (WS consumer; header-then-blob protocol; `createImageBitmap`; sends forwarded input):
```ts
import { isStreamFrame, type ForwardedInput, type StreamFrameMeta } from '../../shared/contract'

export interface DecodedFrame { bitmap: ImageBitmap; meta: StreamFrameMeta }

export class StreamClient {
  private ws: WebSocket | null = null
  private pendingMeta: StreamFrameMeta | null = null
  private readonly frameListeners = new Set<(f: DecodedFrame) => void>()
  constructor(private readonly url: string, private readonly portalId: string) {}

  connect(): void {
    const ws = new WebSocket(`${this.url}?role=consumer`)
    ws.binaryType = 'blob'
    ws.onmessage = (e) => this.handleMessage(e.data)
    this.ws = ws
  }
  async handleMessage(data: unknown): Promise<void> {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data)
      if (isStreamFrame(parsed)) this.pendingMeta = parsed
      return
    }
    if (data instanceof Blob && this.pendingMeta) {
      const bitmap = await createImageBitmap(data)
      const meta = this.pendingMeta; this.pendingMeta = null
      for (const l of this.frameListeners) l({ bitmap, meta })
    }
  }
  onFrame(l: (f: DecodedFrame) => void): () => void { this.frameListeners.add(l); return () => this.frameListeners.delete(l) }
  sendInput(event: ForwardedInput): void {
    this.ws?.send(JSON.stringify({ type: 'input', portalId: this.portalId, event }))
  }
  dispose(): void { this.ws?.close() }
}
```

**Step 4: Implement `TexturePresenter.tsx`** (uploads bitmaps to a `CanvasTexture`-backed material; forwards pointer events as normalized coords):
```tsx
import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { TransportDescriptor, ForwardedInput } from '../../../shared/contract'
import { StreamClient } from '../../io/StreamClient'

interface Props { transport: TransportDescriptor; providerOrigin: string; portalId: string; width: number; height: number; engaged: boolean }

export function TexturePresenter({ transport, providerOrigin, portalId, width, height, engaged }: Props) {
  const texture = useMemo(() => {
    const t = new THREE.Texture()
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const clientRef = useRef<StreamClient | null>(null)

  useEffect(() => {
    if (!transport.streamEndpoint) return
    const wsUrl = new URL(transport.streamEndpoint, providerOrigin).toString().replace(/^http/, 'ws')
    const client = new StreamClient(wsUrl, portalId)
    clientRef.current = client
    const off = client.onFrame(({ bitmap }) => { texture.image = bitmap; texture.needsUpdate = true })
    client.connect()
    return () => { off(); client.dispose(); clientRef.current = null }
  }, [transport.streamEndpoint, providerOrigin, portalId, texture])

  const forward = (kind: ForwardedInput['kind']) => (e: { uv?: THREE.Vector2 }) => {
    if (!engaged || !e.uv) return
    clientRef.current?.sendInput({ kind, x: e.uv.x, y: 1 - e.uv.y })
  }

  return (
    <mesh onPointerDown={forward('pointerdown')} onPointerMove={forward('pointermove')} onPointerUp={forward('pointerup')}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
```

**Step 5: Browser smoke test** — mounts `TexturePresenter` in a canvas, feeds one fake frame through a stubbed `StreamClient`, asserts no throw + a texture map is set. Run → PASS.

---

## Task 4: `StencilPresenter` — native world via drei (browser smoke)

**Files:**
- Create: `packages/portal/src/components/presenters/StencilPresenter.tsx`
- Test: `packages/portal/src/components/presenters/StencilPresenter.browser.test.tsx`

**Step 1: Failing smoke test:**
```tsx
import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { StencilPresenter } from './StencilPresenter'

describe('StencilPresenter', () => {
  it('renders a native world through the portal material without throwing', async () => {
    const { container } = render(
      <Canvas>
        <StencilPresenter width={2} height={2}>
          <mesh><boxGeometry /><meshStandardMaterial color="hotpink" /></mesh>
        </StencilPresenter>
      </Canvas>,
    )
    await new Promise((r) => setTimeout(r, 60))
    expect(container.querySelector('canvas')).toBeTruthy()
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `StencilPresenter.tsx`** (drei `MeshPortalMaterial` — the true GPU portal into a native scene):
```tsx
import { MeshPortalMaterial } from '@react-three/drei'
import type { ReactNode } from 'react'

/** Renders an arbitrary three.js-native world (children) inside the aperture via a
 *  GPU stencil portal — no DOM, no provider round-trip. The literal "window into
 *  another world". */
export function StencilPresenter({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <MeshPortalMaterial>
        {children}
      </MeshPortalMaterial>
    </mesh>
  )
}
```
> Native-world content is supplied by the consumer as `<Portal app="...">{children}</Portal>` for `kind:'native'` (the registered native app provides a React subtree). Add an optional `children` prop to `Portal` for this case.

**Step 4: Run → PASS.**

---

## Task 5: Presenter selection + fallthrough in `Portal.tsx` (TDD)

**Files:**
- Create: `packages/portal/src/components/lib/selectPresenter.ts`
- Modify: `packages/portal/src/components/Portal.tsx`
- Test: `packages/portal/src/components/lib/selectPresenter.unit.test.ts`

**Step 1: Failing test** (fallthrough order `dom-window → texture → poster`):
```ts
import { describe, it, expect } from 'vitest'
import { selectPresenter } from './selectPresenter'

describe('selectPresenter', () => {
  it('uses the negotiated transport when healthy', () => {
    expect(selectPresenter({ transport: 'dom-window', url: '/x/' }, { domWindowFailed: false })).toBe('dom-window')
    expect(selectPresenter({ transport: 'texture', streamEndpoint: '/s' }, {})).toBe('texture')
    expect(selectPresenter({ transport: 'stencil', native: true }, {})).toBe('stencil')
  })
  it('falls through dom-window→texture→poster on failure', () => {
    expect(selectPresenter({ transport: 'dom-window', url: '/x/', streamEndpoint: '/s' }, { domWindowFailed: true })).toBe('texture')
    expect(selectPresenter({ transport: 'dom-window', url: '/x/' }, { domWindowFailed: true })).toBe('poster')
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `selectPresenter.ts`:**
```ts
import type { TransportDescriptor, PresenterKind } from '../../../shared/contract'
export type RenderChoice = PresenterKind | 'poster'

/** Resolve which presenter to render, honoring negotiated transport and falling
 *  through to a guaranteed-renderable poster so a portal is never blank (FR-3). */
export function selectPresenter(
  t: TransportDescriptor,
  health: { domWindowFailed?: boolean } = {},
): RenderChoice {
  if (t.transport === 'stencil' && t.native) return 'stencil'
  if (t.transport === 'texture' && t.streamEndpoint) return 'texture'
  if (t.transport === 'dom-window') {
    if (!health.domWindowFailed) return 'dom-window'
    if (t.streamEndpoint) return 'texture' // provider offered a stream fallback
    return 'poster'
  }
  return 'poster'
}
```

**Step 4: Wire into `Portal.tsx`** — replace the M1 single-branch render with `selectPresenter(transport, { domWindowFailed })`, rendering `DomWindowPresenter` / `TexturePresenter` / `StencilPresenter` / a `PortalFluid` poster accordingly. Track `domWindowFailed` from an iframe `onerror`/load-timeout.

**Step 5: Run → PASS.**

---

## Task 6: Streamed-app fixture + manual all-kinds verification

**Files:**
- Create: `packages/portal/ssr/fixtures/demo-stream/producer.ts` (a real frame producer: renders a moving rectangle to an `OffscreenCanvas`, sends bitmaps over the stream socket as the `demo-stream` producer)

**Step 1:** Implement a genuine producer that connects to `ws://localhost:5179/stream/demo-stream?role=producer`, draws an animated frame to a canvas at ~15 fps, `convertToBlob()`/`transferToImageBitmap()`, and sends `{type:'frame',...}` + the blob. Real, not simulated.

**Step 2: Manual verification (all four kinds in one scene):**
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal
pnpm dev:server &                         # provider + stream relay
pnpm exec tsx ssr/fixtures/demo-stream/producer.ts &   # streamed guest
pnpm dev:client                            # harness with 4 portals
```
Place `demo-static` (dom-window), `demo-dynamic` (dom-window proxy), `demo-stream` (texture), `demo-native` (stencil) in `App.tsx`. Verify each shows a live, non-blank view; the stream portal animates and forwards clicks; the native portal shows the in-engine world. Then kill the producer mid-run → that portal degrades to poster (fallthrough), others unaffected.

---

## Done when (M3 gate)
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal
pnpm exec tsc -b && pnpm exec vitest run && pnpm exec eslint .
```
- [ ] All four `AppKind`s present a working, non-blank view (tested + manual).
- [ ] Stream frames decode to a texture; pointer events forward as normalized coords (tested).
- [ ] Native world renders through `MeshPortalMaterial` (smoke).
- [ ] Killing a guest triggers `poster` fallthrough; the portal is never blank (manual).
- [ ] Unregistered stream id is rejected at the socket (tested).

## TODOs discovered (do NOT fix here)
- WebRTC stream transport (lower latency than ImageBitmap-over-WS) — future, only if frame rate is insufficient.
- Keyboard forwarding for the texture path beyond pointer (focus model) — revisit in M4 if a streamed guest needs text input.
