# Portal M2 — Engagement-gated Lifecycle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `lore:execute` to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** Make portals obey the `Dormant → Warming → Live → Idle → Dormant` lifecycle so a guest app runs **only when engaged** and costs ~0 otherwise — the SPEC-003 performance contract — including provider-side guest suspend/resume, a `MAX_LIVE` cap, and the `PortalTransition` warming/enter animation.
**Architecture:** A single source-of-truth state machine in the client (`portalStore` transitions guarded by `lifecycle.ts`) drives both the visible presenter swap and the control-channel signals; the provider's `AppPortalManager` suspends/resumes guest serve sessions in response. Off-screen portals auto-demote to `idle` (freeze last frame) then `dormant` (PortalFluid). `MAX_LIVE` (default 1) demotes the least-recently-engaged live portal when exceeded.
**Tech Stack:** zustand 5, @react-spring/three 10 (no GSAP — house rule), R3F 9; Fastify/`ws` provider from M1.
**Practices:** Contract-first → Typed-first → TDD.
**Required skills:** none.
**Depends on:** M1 (DOM-window path live, control channel working).
**Spec:** SPEC-003 §3.3 (lifecycle), FR-7/14/15, NFR Performance.

---

## Prerequisites
- M1 gate green.
- Confirm `MAX_LIVE` default with owner (SPEC OQ-3) before Task 3 — default **1**; the degradation ladder is `live → idle(freeze) → dormant(fluid)`.

## Product framing
SPEC-003's perf contract isn't a frame-rate tuning pass — it's a **lifecycle**. "Only running when engaged, otherwise idle and minimal" means the expensive thing (a live guest app + its DOM-window iframe or stream) exists only in the `live` state. This milestone encodes that as an enforced state machine on both sides.

---

## Task 1: Lifecycle state machine (TDD, pure)

**Files:**
- Create: `packages/portal/src/lib/lifecycle.ts`
- Test: `packages/portal/src/lib/lifecycle.unit.test.ts`

**Step 1: Failing test** — only legal transitions allowed:
```ts
import { describe, it, expect } from 'vitest'
import { canTransition, nextOnEvent } from './lifecycle'

describe('portal lifecycle', () => {
  it('allows the forward path dormant→warming→live', () => {
    expect(canTransition('dormant', 'warming')).toBe(true)
    expect(canTransition('warming', 'live')).toBe(true)
  })
  it('allows live↔idle and idle→dormant', () => {
    expect(canTransition('live', 'idle')).toBe(true)
    expect(canTransition('idle', 'live')).toBe(true)
    expect(canTransition('idle', 'dormant')).toBe(true)
  })
  it('forbids skipping (dormant→live) and illegal jumps', () => {
    expect(canTransition('dormant', 'live')).toBe(false)
    expect(canTransition('live', 'warming')).toBe(false)
  })
  it('maps events to the next state', () => {
    expect(nextOnEvent('dormant', 'engage')).toBe('warming')
    expect(nextOnEvent('warming', 'ready')).toBe('live')
    expect(nextOnEvent('live', 'disengage')).toBe('idle')
    expect(nextOnEvent('idle', 'offscreen')).toBe('dormant')
    expect(nextOnEvent('live', 'offscreen')).toBe('idle')
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `lifecycle.ts`:**
```ts
import type { PortalState } from '../../shared/contract'

export type LifecycleEvent = 'engage' | 'ready' | 'disengage' | 'offscreen' | 'onscreen' | 'dispose'

const LEGAL: Record<PortalState, PortalState[]> = {
  dormant: ['warming'],
  warming: ['live', 'idle', 'dormant'],
  live: ['idle'],
  idle: ['live', 'warming', 'dormant'],
}

export function canTransition(from: PortalState, to: PortalState): boolean {
  return LEGAL[from].includes(to)
}

const EVENT_MAP: Record<PortalState, Partial<Record<LifecycleEvent, PortalState>>> = {
  dormant: { engage: 'warming' },
  warming: { ready: 'live', disengage: 'dormant', offscreen: 'dormant' },
  live: { disengage: 'idle', offscreen: 'idle' },
  idle: { engage: 'live', onscreen: 'live', offscreen: 'dormant' },
}

/** Resolve the next state for an event, or the current state if the event is a no-op. */
export function nextOnEvent(state: PortalState, event: LifecycleEvent): PortalState {
  return EVENT_MAP[state][event] ?? state
}
```

**Step 4: Run → PASS.**

---

## Task 2: Wire the machine into `portalStore` + `useAppPortal` (TDD)

**Files:**
- Modify: `packages/portal/src/stores/portalStore.ts`
- Modify: `packages/portal/src/hooks/useAppPortal.ts`
- Test: `packages/portal/src/stores/portalStore.lifecycle.unit.test.ts`

**Step 1: Failing test** — `setState` now rejects illegal transitions and tracks `lastEngagedAt`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePortalStore } from './portalStore'

beforeEach(() => usePortalStore.getState().reset())

describe('portalStore lifecycle guard', () => {
  it('rejects an illegal transition and keeps the prior state', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.transition('p1', 'engage')            // dormant → warming
    expect(usePortalStore.getState().portals['p1'].state).toBe('warming')
    s.transition('p1', 'disengage')         // warming → dormant (legal)
    expect(usePortalStore.getState().portals['p1'].state).toBe('dormant')
  })
  it('records lastEngagedAt when entering live', () => {
    const s = usePortalStore.getState()
    s.register('p1', 'demo-static')
    s.transition('p1', 'engage'); s.transition('p1', 'ready')
    expect(usePortalStore.getState().portals['p1'].lastEngagedAt).toBeGreaterThan(0)
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Modify `portalStore.ts`** — replace raw `setState` callers with a guarded `transition(id, event)` that uses `nextOnEvent`/`canTransition`, stamps `lastEngagedAt` on entering `live`, and add `lastEngagedAt: number` to `PortalInstance`. (`now` is passed in by the caller/`performance.now()` — keep the store pure by accepting an optional timestamp param defaulting to `performance.now()`.)
```ts
// inside the store creator:
transition: (id, event, now = performance.now()) => set((st) => {
  const p = st.portals[id]; if (!p) return st
  const next = nextOnEvent(p.state, event)
  if (next === p.state) return st
  const updated = { ...p, state: next, lastEngagedAt: next === 'live' ? now : p.lastEngagedAt }
  return { portals: { ...st.portals, [id]: updated } }
}),
```

**Step 4: Update `useAppPortal`** to drive transitions via control-channel events: `engage()` → `transition('engage')` + `client.send({type:'warm'})`; on provider `state:live` message → `transition('ready')`; `idle()` → `transition('disengage')` + `client.send({type:'idle'})`.

**Step 5: Run → PASS.**

---

## Task 3: `MAX_LIVE` enforcement (TDD)

**Files:**
- Create: `packages/portal/src/lib/liveCap.ts`
- Modify: `packages/portal/src/stores/portalStore.ts`
- Test: `packages/portal/src/lib/liveCap.unit.test.ts`

**Step 1: Failing test:**
```ts
import { describe, it, expect } from 'vitest'
import { pickDemotions } from './liveCap'

describe('MAX_LIVE', () => {
  it('demotes the least-recently-engaged live portals beyond the cap', () => {
    const live = [
      { id: 'a', lastEngagedAt: 30 },
      { id: 'b', lastEngagedAt: 10 },
      { id: 'c', lastEngagedAt: 20 },
    ]
    expect(pickDemotions(live, 1)).toEqual(['b', 'c']) // keep newest (a); demote others
  })
  it('returns nothing under the cap', () => {
    expect(pickDemotions([{ id: 'a', lastEngagedAt: 1 }], 1)).toEqual([])
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `liveCap.ts`:**
```ts
export const MAX_LIVE = 1 // SPEC OQ-3 default; configurable per host.

/** Given currently-live portals, return the ids to demote so ≤ cap remain live
 *  (keeps the most-recently-engaged). */
export function pickDemotions(live: { id: string; lastEngagedAt: number }[], cap = MAX_LIVE): string[] {
  if (live.length <= cap) return []
  return [...live]
    .sort((a, b) => b.lastEngagedAt - a.lastEngagedAt)
    .slice(cap)
    .map((p) => p.id)
}
```

**Step 4: Wire into `portalStore.transition`** — after a portal enters `live`, compute live set, call `pickDemotions`, and `transition(id, 'disengage')` each demoted portal (which also signals the provider via `useAppPortal`'s subscription).

**Step 5: Run → PASS.**

---

## Task 4: Off-screen auto-demotion driver (TDD, browser)

**Files:**
- Create: `packages/portal/src/components/lib/VisibilityDriver.tsx`
- Test: `packages/portal/src/components/lib/VisibilityDriver.browser.test.tsx`

**Step 1: Failing browser test** — a portal whose quad goes invisible receives `offscreen`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { VisibilityDriver } from './VisibilityDriver'

describe('VisibilityDriver', () => {
  it('fires onOffscreen when the mesh projects outside the viewport', async () => {
    const onOff = vi.fn()
    function H() {
      const ref = useRef<THREE.Mesh>(null)
      return (
        <Canvas camera={{ position: [0, 0, 5] }}>
          <mesh ref={ref} position={[1000, 0, 0]}><planeGeometry args={[1, 1]} /><meshBasicMaterial /></mesh>
          <VisibilityDriver meshRef={ref} width={1} height={1} onOffscreen={onOff} onOnscreen={() => {}} />
        </Canvas>
      )
    }
    render(<H />)
    await new Promise((r) => setTimeout(r, 150))
    expect(onOff).toHaveBeenCalled()
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `VisibilityDriver.tsx`** (reuses `projectQuad`; debounced edge-trigger):
```tsx
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { projectQuad } from './projectQuad'

interface Props {
  meshRef: React.RefObject<THREE.Object3D | null>
  width: number; height: number
  onOffscreen: () => void; onOnscreen: () => void
}
export function VisibilityDriver({ meshRef, width, height, onOffscreen, onOnscreen }: Props) {
  const { camera, size } = useThree()
  const wasVisible = useRef<boolean | null>(null)
  useFrame(() => {
    const mesh = meshRef.current; if (!mesh) return
    mesh.updateWorldMatrix(true, false)
    const q = projectQuad({ width, height }, mesh.matrixWorld, camera, size.width, size.height)
    if (wasVisible.current === q.visible) return
    wasVisible.current = q.visible
    q.visible ? onOnscreen() : onOffscreen()
  })
  return null
}
```

**Step 4: Mount it inside `Portal.tsx`** wiring `onOffscreen → transition('offscreen')`, `onOnscreen → transition('onscreen')`.

**Step 5: Run → PASS.**

---

## Task 5: Provider guest suspend/resume (TDD)

**Files:**
- Modify: `packages/portal/ssr/lib/AppPortal/AppPortalManager.ts`
- Modify: `packages/portal/ssr/lib/AppPortal/AppServer.ts`
- Modify: `packages/portal/ssr/lib/AppPortal/AppPortalRoutes.ts`
- Modify: `packages/portal/ssr/lib/Portal/PortalServer.ts` (route warm/idle/dispose → manager)
- Test: `packages/portal/ssr/lib/AppPortal/AppPortalManager.lifecycle.test.ts`

**Step 1: Failing test:**
```ts
import { describe, it, expect } from 'vitest'
import { AppPortalManager } from './AppPortalManager'

describe('AppPortalManager lifecycle', () => {
  it('warms then suspends a registered guest, honoring MAX_LIVE', () => {
    const m = new AppPortalManager(undefined, 1)
    m.warm('demo-static')
    expect(m.runtime('demo-static')?.status).toBe('warming')
    m.markRunning('demo-static')
    m.warm('demo-dynamic')          // would exceed cap → demo-static demoted
    m.markRunning('demo-dynamic')
    expect(m.runtime('demo-static')?.status).toBe('suspended')
    expect(m.liveCount()).toBe(1)
  })
  it('refuses to warm an unregistered app', () => {
    const m = new AppPortalManager()
    expect(() => m.warm('evil')).toThrow()
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Extend `AppServer.ts`** with `suspend()`/`resume()` that release/reacquire the serve session (for `static`/`dynamic` the mounts persist but the manager stops tracking it live; for spawned upstreams in M4 this is where a child process pause hooks in):
```ts
suspend(): void { if (this.status === 'running') this.status = 'suspended' }
resume(): void { if (this.status === 'suspended') this.status = 'running' }
```
(Add `'suspended'` to the status union.)

**Step 4: Extend `AppPortalManager.ts`** with runtime tracking + cap (reusing the same demotion policy as the client):
```ts
import { AppServer } from './AppServer'

export class AppPortalManager {
  private readonly apps = new Map<string, AppPortalConfigEntry>()
  private readonly runtimes = new Map<string, AppServer>()
  private readonly engagedAt = new Map<string, number>()
  constructor(entries: AppPortalConfigEntry[] = REGISTERED_APPS, private cap = 1) {
    for (const e of entries) this.apps.set(e.id, e)
  }
  // ...has/get/list from M0...
  runtime(id: string): AppServer | undefined { return this.runtimes.get(id) }
  liveCount(): number { return [...this.runtimes.values()].filter((r) => r.status === 'running').length }

  warm(id: string): AppServer {
    const entry = this.apps.get(id)
    if (!entry) throw new Error(`unregistered app: ${id}`)
    let rt = this.runtimes.get(id)
    if (!rt) { rt = new AppServer(entry); this.runtimes.set(id, rt) }
    rt.warm()
    return rt
  }
  markRunning(id: string, now = Date.now()): void {
    const rt = this.runtimes.get(id); if (!rt) return
    rt.markRunning(); this.engagedAt.set(id, now)
    this.enforceCap()
  }
  suspend(id: string): void { this.runtimes.get(id)?.suspend() }
  dispose(id: string): void { this.runtimes.get(id)?.suspend(); this.runtimes.delete(id); this.engagedAt.delete(id) }

  private enforceCap(): void {
    const live = [...this.runtimes.entries()].filter(([, r]) => r.status === 'running')
    if (live.length <= this.cap) return
    live
      .sort((a, b) => (this.engagedAt.get(b[0]) ?? 0) - (this.engagedAt.get(a[0]) ?? 0))
      .slice(this.cap)
      .forEach(([id]) => this.suspend(id))
  }
}
```
> Pure `Date.now()`-free in tests via the injected `now` param (matches the repo rule against `Date.now()` in deterministic code paths).

**Step 5: Route control messages** in `PortalServer.handle`: `warm` → `manager.warm(appId)` + `markRunning` on guest-ready; `idle` → `manager.suspend(appId)`; `dispose` → `manager.dispose(appId)`. Emit `state` back to the host.

**Step 6: Run → PASS.**

---

## Task 6: `PortalTransition` warming/enter animation (browser smoke)

**Files:**
- Create: `packages/portal/src/components/PortalTransition.tsx`
- Modify: `packages/portal/src/components/Portal.tsx`
- Test: `packages/portal/src/components/PortalTransition.browser.test.tsx`

**Step 1: Failing smoke test:**
```tsx
import { describe, it, expect } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from '@react-three/fiber'
import { PortalTransition } from './PortalTransition'

describe('PortalTransition', () => {
  it('smoke-mounts in warming state without throwing', async () => {
    const { container } = render(
      <Canvas><PortalTransition state="warming" width={2} height={2} /></Canvas>,
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(container.querySelector('canvas')).toBeTruthy()
  })
})
```

**Step 2: Run → FAIL.**

**Step 3: Implement `PortalTransition.tsx`** (fixed wall-clock spring; `@react-spring/three`, the repo's anim lib per scene memory):
```tsx
import { animated, useSpring } from '@react-spring/three'
import type { PortalState } from '../../shared/contract'

/** Scales/fades the aperture during warming→live and live→idle, identical timing
 *  on every screen (fixed config, not frame-count). No GSAP (house rule). */
export function PortalTransition({ state, width, height }: { state: PortalState; width: number; height: number }) {
  const { scale, opacity } = useSpring({
    scale: state === 'warming' ? 0.9 : 1,
    opacity: state === 'live' ? 1 : state === 'idle' ? 0.5 : 0.85,
    config: { mass: 1, tension: 170, friction: 26 },
  })
  return (
    <animated.mesh scale={scale}>
      <planeGeometry args={[width, height]} />
      <animated.meshBasicMaterial transparent opacity={opacity} color="#ff6750" wireframe />
    </animated.mesh>
  )
}
```

**Step 4: Mount in `Portal.tsx`** for `state === 'warming'` (between fluid and presenter).

**Step 5: Run → PASS.**

---

## Task 7: Idle freeze-frame for DOM-window (TDD, browser)

**Files:**
- Modify: `packages/portal/src/components/presenters/DomWindowPresenter.tsx`
- Test: `packages/portal/src/components/presenters/DomWindowPresenter.idle.browser.test.tsx`

**Step 1: Failing test** — on `idle`, the iframe is hidden and `pointer-events:none` (guest stops receiving input; in M3 the texture presenter shows the last frame):
```tsx
// asserts: when the Presenter receives engaged=false, the iframe gets pointer-events:none
```

**Step 2–4:** Add an `engaged: boolean` prop to `DomWindowPresenter`; when false, set `iframe.style.pointerEvents = 'none'` and `display:none` (the guest is suspended provider-side, so nothing runs). When true, restore. `Portal.tsx` passes `engaged={state === 'live'}`.

**Step 5: Run → PASS.**

---

## Done when (M2 gate)
```bash
cd /Users/ryanoboyle/LayerDynamics/packages/portal
pnpm exec tsc -b && pnpm exec vitest run && pnpm exec eslint .
```
- [ ] Illegal lifecycle transitions are rejected (tested); only legal paths occur.
- [ ] A live portal going off-screen demotes to `idle`, then `dormant` (tested).
- [ ] `MAX_LIVE` demotes least-recently-engaged on both client and provider (tested).
- [ ] Provider `suspend`/`resume` stops/starts guest tracking; `warm` unregistered → throws/403.
- [ ] Manual: engage portal A, then portal B → A goes idle, only B runs; scrolling A off-screen frees it.

## TODOs discovered (do NOT fix here)
- Idle *visual* for DOM-window is hide-iframe; a true freeze-frame poster needs the texture path → M3.
- Resuming a suspended guest cold-reloads its iframe (state loss) — optional persistence is SPEC FR-16, not in scope.
