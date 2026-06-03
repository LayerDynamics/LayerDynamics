# SPEC-003 — Portal Provider

> A three.js **portal provider**: a window/portal that renders another world or app — a three.js-native scene, a static build, a live/SSR app, or a streamed app running on a different URL/port — *inside* the three.js scene, in a specific place and context, fully interactive in place.

| Field | Value |
|-------|-------|
| **Spec ID** | SPEC-003 |
| **Slug** | `portal-provider` |
| **Status** | Draft — owner discovery captured 2026-06-03; awaiting approval before implementation |
| **Owner** | Ryan O'Boyle (Layer Dynamics) — `layerdynamics@proton.me` |
| **Target** | `packages/portal` (`@layerdynamics/portal`) — pnpm workspace package: R3F client library **+** Node provider server (`ssr/`) |
| **Author** | Drafted with Claude Code (`/lore:project-spec-writer`), corrected via owner discovery |
| **Date** | 2026-06-03 |
| **Related** | SPEC-001 (`docs/specs/SPEC-001-r3f-portfolio.md`); SPEC-002 (`docs/specs/SPEC-002-immersive-levels.md`); root `CLAUDE.md`; deploy memory `railway-deploy-and-main-now-holds-app` |

> **Decisions captured from owner discovery (2026-06-03):**
> 1. **The thing shown is an app on a different URL/port, windowed into the three.js scene via the portal.** Not a screenshot, not a baked texture — a live external surface placed in 3D context.
> 2. **It must always work, no matter the situation.** Four content kinds are all in scope: three.js-native world, static web build, live/SSR app, socket-streamed app. The host **negotiates a presentation transport per content kind** so there is always a working path.
> 3. **Full client + server.** The `ssr/` Node provider is a real deliverable, not deferred — it is what makes a cross-origin app embeddable.
> 4. **Generic + portfolio is consumer #1.** `@layerdynamics/portal` is a self-contained reusable primitive; this spec also wires it into SPEC-002's level world as the proving consumer.
> 5. **Fully interactive in place.** The visitor clicks/types/scrolls *into* the windowed app while it sits in the 3D scene — not display-only.
> 6. **Registered apps only.** A Portal points at apps declared in an owner-controlled allowlist (`PortalData` / `AppPortalConfig`); the provider serves/proxies only known origins.
> 7. **Engagement-gated lifecycle.** A guest app runs only when engaged; otherwise it is idle and minimal (frozen/paused placeholder costing ~0). This *is* the performance contract.

---

## 1. Background

### 1.1 Problem Statement

The LayerDynamics portfolio (SPEC-001/002) presents work as **descriptions** of projects — cards, meshes, blurbs. The strongest possible demonstration of an interactive app is **the app itself, running**. There is currently no way to take an arbitrary application — one that lives on its own URL or port, with its own server, framework, and lifecycle — and place it *inside* the 3D world as a live, interactive object framed by the scene's art direction.

The hard part is that "an app on a different URL/port" is **cross-origin**. The browser will not let a WebGL context read pixels out of a cross-origin iframe (tainted-canvas security), and a raw cross-origin iframe dropped over the canvas is neither in the 3D depth order nor framed by the scene. So "just iframe it" fails the *in-world* requirement, and "render it to a texture" fails the *cross-origin* and *interactive* requirements. A dedicated provider is needed to make each guest app embeddable and to choose, per app, a path that is both **in context** and **interactive**.

### 1.2 Current State

`packages/portal` exists as **named-but-empty scaffolding** — every file is present at 0 bytes, so the directory layout encodes an intended two-sided design but contains no logic yet:

- **Client (`src/`):** `components/{Portal,PortalEdge,PortalFluid,PortalTransition,Layout}.tsx`; `io/{connector,PortalClient,AppClient}.ts`; `stores/{portalStore,appStore,config,connectorStore}.ts`; `hooks/{usePortalStore,useAppStore,useConfigStore,useConnectorStore,useAppPortal}.ts`; `data/PortalData.ts`; `App.tsx`, `main.tsx`, `index.html` (the package's own standalone demo harness).
- **Provider (`ssr/`):** `api/server.ts`; `api/routes/{Portal,AppPortal,Config,Static,Dynamic,Stream,Transitions}.ts`; `lib/Portal/{PortalServer,PortalDisplay,PortalAppConnector,AppClient,PortalRoutes}.ts`; `lib/AppPortal/{AppServer,AppPortalManager,AppPortalConfig,AppPortalRoutes,PortalClient}.ts` + serve strategies `Dynamic/APDynamicServe.ts`, `Static/APStaticServe.ts`, `Stream/APSocketStream.ts`.
- **Manifest:** `package.json` = `@layerdynamics/portal`, `private`, `type: module`, version `0.0.0`. No deps declared yet; `tsconfig*.json` empty.

> **Scaffolding note:** `ssr/lib/AppPortal/AppPortalManager.ts.ts` has a double `.ts.ts` extension — a typo to be corrected to `AppPortalManager.ts` during implementation, not enshrined.

Nothing references the package except an incidental string in `apps/client/src/components/Nav.stories.tsx`. The host portfolio (`apps/client`) already ships the R3F ecosystem this package builds on: `@react-three/fiber` 9, `@react-three/drei` 10 (provides `<Html>`, `MeshPortalMaterial`), `@react-three/offscreen`, `three` 0.184, `zustand` 5, `uikit`.

### 1.3 Target Users

1. **The portfolio owner (primary author/consumer).** Registers his own apps and demos so they appear live inside the level world (SPEC-002 "Other Work" / dedicated demo levels) instead of as static cards.
2. **Site visitors (end users).** Prospective employers/collaborators who walk up to a portal in the 3D scene and *use the real app* — click through it, type into it — without leaving the experience.
3. **Future package consumers.** Any R3F project that wants to drop a live external app into a scene with one declarative `<Portal>` component and a registered app entry. `@layerdynamics/portal` is built to be reused beyond this repo.

### 1.4 Motivation

A portfolio that *runs* the work beats one that *lists* it. The portal mechanism is itself a non-trivial graphics/systems artifact (cross-origin embedding, transport negotiation, in-world DOM registration, lifecycle suspension) — building it advances the portfolio's thesis ("the site demonstrates the skills it advertises") while producing a reusable primitive. SPEC-002 gives it an immediate home and a deadline-shaped proving ground.

### 1.5 Assumptions

- The host application is a React Three Fiber app (React 19, R3F 9, three 0.184+) running in a modern evergreen browser with WebGL2.
- Guest apps are **owner-controlled and registered**; the provider may serve, proxy, or stream them and may set their headers (CSP/`X-Frame-Options`) to permit embedding. This spec does **not** attempt to embed arbitrary third-party origins that forbid framing.
- The provider runs as a Node service deployable on **Railway** (consistent with existing infra; see deploy memory). Same-origin embedding is achieved by routing guest traffic through the provider's origin.
- Network egress between provider and guest apps is available (provider can reach each registered app's URL/port).
- "Fully interactive in place" is satisfied when the portal faces the camera near-planar; heavily oblique/curved portals degrade to event-forwarded or enter-to-use interaction (see FR-9, OQ-2).

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-1 | MUST | The system MUST render a **Portal** as a placed object in an R3F scene (position/orientation/size as props) that displays a guest "world/app" within its aperture. |
| FR-2 | MUST | The system MUST support four guest **content kinds** and always present *some* working view of each: (a) three.js-native world, (b) static web build, (c) live/SSR app, (d) socket-streamed app. |
| FR-3 | MUST | The host MUST **negotiate a presentation transport** with the provider per guest app and select a matching **Presenter** (DOM-window / texture / stencil), so that an unsupported path for one kind never leaves a blank portal. |
| FR-4 | MUST | A guest app running on a **different URL/port (cross-origin)** MUST be embeddable; the provider MUST make it presentable (serve/proxy same-origin, or stream) rather than requiring the host to read cross-origin pixels. |
| FR-5 | MUST | Guest apps MUST be **fully interactive in place** for the DOM-window transport: mouse, keyboard, and scroll events reach the live app while it is framed inside the 3D scene. |
| FR-6 | MUST | Portals MUST point only at **registered apps** declared in `PortalData` (client) / `AppPortalConfig` (provider). Requests for unregistered origins MUST be rejected by the provider. |
| FR-7 | MUST | Each portal MUST follow the **engagement-gated lifecycle**: `Dormant → Warming → Live → Idle → Dormant`. A guest app's process/stream MUST run only in `Live` (engaged); `Idle`/`Dormant` MUST cost ~0 (frozen frame or `PortalFluid` placeholder, no live guest compute). |
| FR-8 | MUST | The host MUST keep the DOM-window guest **registered to the portal's projected screen-space quad** every frame (position, size, and clip track the 3D transform) and respect occlusion/depth so the windowed app reads as *inside* the scene. |
| FR-9 | SHOULD | When a portal is too oblique/curved for a registered DOM iframe to track accurately, the system SHOULD fall back to the **texture presenter with forwarded input events**, or offer an **enter-to-use** zoom that flattens the portal to a screen-aligned interactive surface. |
| FR-10 | MUST | The provider MUST expose three serve strategies — **Static** (`APStaticServe`), **Dynamic/SSR-proxy** (`APDynamicServe`), **Stream** (`APSocketStream`) — and a **Config** endpoint advertising each registered app's kind, transport, and sandbox policy. |
| FR-11 | MUST | The host MUST render the portal's **art-directed frame**: `PortalEdge` (rim) and `PortalFluid` (the dormant "another-world" surface), plus `PortalTransition` for warming/enter/exit. |
| FR-12 | SHOULD | The package SHOULD ship a **standalone demo harness** (`src/App.tsx` + `index.html`) that mounts example portals against a local provider, runnable independently of `apps/client`. |
| FR-13 | SHOULD | The package SHOULD be **consumable by `apps/client`** (SPEC-002) so registered project apps appear live in the level world (consumer #1). |
| FR-14 | SHOULD | The provider SHOULD **suspend/resume** guest apps (`AppPortalManager`) in response to host lifecycle signals, releasing guest resources when no portal is `Live`. |
| FR-15 | COULD | The system COULD support **multiple simultaneous live portals** (more than one engaged app) subject to the frame budget (NFR perf). |
| FR-16 | COULD | The system COULD **persist/restore guest app state** across `Idle`↔`Live` cycles (e.g. resume where the visitor left off) rather than cold-reloading. |
| FR-17 | WONT | The system WILL NOT embed arbitrary, unregistered third-party origins, nor bypass an external site's `X-Frame-Options`/CSP framing protections. |
| FR-18 | WONT | The system WILL NOT provide authentication, user accounts, or per-visitor persistence of guest-app data in this version. |

### 2.2 Non-Functional Requirements

#### Performance (the engagement-gated contract)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Host frame rate, portals idle/dormant | Host scene holds **≥ 60 fps** desktop / **≥ 30 fps** mobile with all portals `Dormant`/`Idle` | R3F `useFrame` delta sampling; an idle portal adds **0 live-guest draw/compute** (placeholder only) |
| Host frame rate, one portal `Live` | Host scene holds **≥ 30 fps** with one engaged DOM-window portal | Same; guest runs in its own browsing context / worker, not the host's render loop |
| Idle guest cost | A non-engaged guest performs **no animation frames or network polling** (suspended) | Provider confirms guest paused; host shows frozen frame / `PortalFluid` |
| Warming latency | `Warming → Live` completes in **< 1.5 s p95** for static, **< 3 s p95** for dynamic/stream (warm provider) | Timestamp from engage intent to first interactive frame |
| Quad registration error | DOM-window guest rectangle tracks the projected portal quad within **≤ 2 px** at rest, no visible drift during camera motion | Visual/measured offset between iframe rect and projected quad |
| Concurrent live portals | Define a hard cap `MAX_LIVE` (default **1**, configurable); beyond it, least-recently-engaged portals drop to `Idle` | `portalStore` enforces the cap |

#### Reliability

| Metric | Target |
|--------|--------|
| Guest unreachable / crashes | Portal degrades to `Idle` with a visible error/poster state; host scene never crashes or stalls |
| Transport negotiation failure | Falls through the presenter chain (DOM-window → texture → poster); a portal is never left blank |
| Provider restart | Host reconnects via `connector` with backoff; dormant portals are unaffected |

#### Security & Compliance

- **Allowlist enforcement:** provider serves/proxies/streams **only** origins in `AppPortalConfig`; all other targets 403. No open proxy.
- **Sandboxing:** DOM-window iframes carry an explicit `sandbox` policy per registered app (minimum tokens needed for interaction); same-origin proxying is used to grant interaction without granting blanket `allow-same-origin` to a foreign origin.
- **Headers:** provider sets framing/CSP headers on served/proxied guest responses so embedding is permitted *for its own origin only*; `frame-ancestors` restricts who may frame the provider.
- **Transport boundary:** host↔provider and host↔guest messaging uses a typed, origin-checked `postMessage`/WebSocket protocol (validated `targetOrigin`, no wildcard).
- **Data sensitivity:** public portfolio content only; no PII, no auth, no compliance regime (SOC2/GDPR/HIPAA) in scope. Audit logging limited to provider access logs for registered-origin requests.

#### Scalability

- Scale dimension is **portals per scene** and **guest sessions per provider**, not request throughput. Targets: comfortably author **a handful (≤ ~12) registered apps** and **dozens of placed portals**, with `MAX_LIVE` bounding concurrent running guests. The provider is a single Railway service (vertical scale first); horizontal scale is a non-goal for v1.

### 2.3 Constraints

- **Language/runtime:** TypeScript throughout. Client = React 19 + R3F 9 + three 0.184 (match `apps/client`). Provider = Node ESM (`type: module`), Vite-buildable; HTTP + WebSocket server.
- **Build:** must pass `tsc -b` under the workspace's strict config and build via Vite; client and provider have split tsconfigs (`tsconfig.web.json` / `tsconfig.node.json`).
- **No new heavyweight deps without cause:** prefer the already-present R3F/drei/zustand stack; the provider's HTTP/WS layer should use a minimal, well-understood library.
- **Deploy:** provider deploys on Railway alongside the existing app deploy (see memory `railway-deploy-and-main-now-holds-app`; mind Vite `preview` `allowedHosts`).
- **Browser:** WebGL2 + evergreen browsers; no IE/legacy.

### 2.4 Explicit Non-Goals (this version)

- Embedding arbitrary third-party sites that forbid framing (FR-17).
- Auth, accounts, or per-visitor saved state (FR-18).
- Horizontal/multi-region provider scaling, autoscaling, or a CDN tier for streamed frames.
- A visual portal-authoring GUI — portals are declared in code/data.
- VR/AR/WebXR portals.
- Light-mode/theming of guest apps — guests render themselves.

---

## 3. Architecture

### 3.1 System Overview

Portal is a **two-sided system**. The **host** side (`src/`) runs inside any R3F app and draws the portal object, manages its lifecycle, and presents the guest. The **provider** side (`ssr/`) is a Node service that makes each registered guest app *presentable* (serving, proxying, or streaming it) and manages guest lifecycle. They speak over a control channel; the guest app itself is the third party, made embeddable by the provider.

```
┌──────────────────────────── BROWSER (host R3F app) ─────────────────────────────┐
│  apps/client  /  portal demo harness                                            │
│  ┌───────────────────────── @layerdynamics/portal (client) ─────────────────┐   │
│  │  <Portal app="…">                                                         │   │
│  │    PortalEdge (rim)  +  PortalFluid (dormant world)  +  PortalTransition  │   │
│  │    └─ Presenter (chosen by negotiation):                                  │   │
│  │         • DomWindowPresenter  → iframe clipped to projected quad (interactive)
│  │         • TexturePresenter    → WebGLRenderTarget / streamed frames        │   │
│  │         • StencilPresenter    → drei MeshPortalMaterial (native world)     │   │
│  │  stores: portalStore · appStore · config · connectorStore                 │   │
│  │  io:     connector (negotiate) · PortalClient (control) · AppClient (guest)│   │
│  └───────────────────────────────────┬───────────────────────────────────────┘   │
└──────────────────────────────────────┼────────────────────────────────────────────┘
            control channel (WS/HTTP)   │   negotiate → transport descriptor
                                        ▼
┌──────────────────────── NODE provider (@layerdynamics/portal ssr) ────────────────┐
│  api/server.ts → routes: Config · Portal · AppPortal · Static · Dynamic · Stream · │
│                          Transitions                                               │
│  lib/Portal/      PortalServer · PortalDisplay · PortalAppConnector · AppClient    │
│  lib/AppPortal/   AppServer · AppPortalManager · AppPortalConfig (allowlist)       │
│        strategies  Static/APStaticServe · Dynamic/APDynamicServe · Stream/APSocketStream
└───────────────┬─────────────────┬──────────────────┬─────────────────────────────┘
   serve same-  │   proxy/SSR      │   socket stream  │
   origin build │   same-origin    │   frames+events  │
                ▼                  ▼                  ▼
        ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
        │ static app  │    │ live/SSR app │    │ streamed app │   ← registered guest apps
        │  (build)    │    │ (url:port)   │    │  (url:port)  │      on their own URLs/ports
        └─────────────┘    └──────────────┘    └──────────────┘
```

### 3.2 Component Design

#### Client components (`src/components/`)

**`Portal.tsx`** — *Responsibility:* the public R3F component; places the aperture in the scene, owns its lifecycle state, and mounts the chosen Presenter. *Tech:* R3F mesh + drei. *Interfaces:* props `{ app: AppId, size, position, rotation, onEngage?, onState? }`. *Deps:* `useAppPortal`, `portalStore`, Presenters, `PortalEdge`/`PortalFluid`/`PortalTransition`.

**`PortalEdge.tsx`** — *Responsibility:* renders the portal rim/frame (brand coral edge glow, depth mask that makes the aperture read as a cut into another space). *Tech:* custom shader material on a ring/frame mesh. *Interfaces:* `{ radius/size, intensity, state }`.

**`PortalFluid.tsx`** — *Responsibility:* the animated "another world" surface shown while a portal is `Dormant`/`Idle` (energy/liquid look) — the cheap, always-on placeholder that costs ~0 guest compute. *Tech:* shader on the aperture plane. *Interfaces:* `{ state, palette }`.

**`PortalTransition.tsx`** — *Responsibility:* drives `Warming`/enter/exit/`enter-to-use` animations (fade/zoom/flatten) with consistent wall-clock timing. *Tech:* `@react-spring/three` or `THREE.MathUtils.damp` (no GSAP — house rule). *Interfaces:* `{ from, to, onDone }`.

**`Layout.tsx`** — *Responsibility:* the standalone demo harness layout (Canvas + controls) used by the package's own `App.tsx`/`main.tsx`. *Deps:* host R3F only.

#### Client io (`src/io/`)

**`connector.ts`** — *Responsibility:* **transport negotiation** — given an `AppId`, asks the provider (`/config`,`/portal`) for the app's kind + transport descriptor and resolves which Presenter to use; opens the control channel. *Interfaces:* `negotiate(appId) → { kind, transport, presenter, sandbox }`. *Deps:* `connectorStore`, `PortalClient`.

**`PortalClient.ts`** — *Responsibility:* host→provider **control channel** (lifecycle signals: warm/engage/idle/dispose; reconnect+backoff). *Tech:* WebSocket (+HTTP for config). *Interfaces:* `warm/engage/idle/dispose(portalId)`; events `state`, `error`.

**`AppClient.ts`** — *Responsibility:* host-side handle to one **guest app instance** — forwards input events (for texture/event-forwarding mode), relays typed `postMessage` to the windowed app, surfaces guest readiness. *Interfaces:* `sendInput(evt)`, `onReady`, `postMessage(msg)`.

#### Client state (`src/stores/`, zustand)

**`portalStore.ts`** — registry of mounted portals: `{ id, appId, state, engaged, presenter, quad }`; enforces `MAX_LIVE`; lifecycle transitions. **`appStore.ts`** — per-guest-app runtime state (ready, error, last frame). **`config.ts`** — loaded `PortalData` (registered apps + defaults). **`connectorStore.ts`** — live transport/connection status per portal.

Hooks (`src/hooks/`) are thin selectors over those stores; **`useAppPortal.ts`** is the orchestration hook a `<Portal>` uses to mount → negotiate → drive lifecycle.

**`data/PortalData.ts`** — the client-side **registered-app catalog** (id, label, kind, default size, preferred presenter, provider route). Mirrors the provider's `AppPortalConfig` allowlist.

#### Provider — `lib/Portal/` (the host-facing side of the provider)

**`PortalServer.ts`** — owns a server-side **portal session** (one per live portal): negotiation responses, control-channel handling, lifecycle. **`PortalDisplay.ts`** — describes *what* a portal currently shows (transport descriptor, dimensions, frame source). **`PortalAppConnector.ts`** — binds a portal session to a specific guest app via `AppServer`. **`AppClient.ts`** — provider→guest connection (drive/observe the guest). **`PortalRoutes.ts`** — registers the `/portal` HTTP/WS routes.

#### Provider — `lib/AppPortal/` (guest-app management)

**`AppServer.ts`** — runs/proxies one guest app (spawn or connect to its URL:port), applies framing/CSP headers, exposes it through the chosen serve strategy. **`AppPortalManager.ts`** — registry + **lifecycle** of all guest apps (warm/suspend/resume/dispose; honors `MAX_LIVE`; releases idle guests). **`AppPortalConfig.ts`** — the **allowlist + per-app policy** (origin, kind, serve strategy, sandbox tokens, headers). **`AppPortalRoutes.ts`** — `/app-portal` management routes. **`PortalClient.ts`** — guest→portal side of the protocol. **Serve strategies:** `Static/APStaticServe.ts` (serve a static build same-origin), `Dynamic/APDynamicServe.ts` (SSR/reverse-proxy a live app same-origin), `Stream/APSocketStream.ts` (WebSocket frame/event stream for RTT).

#### Provider — `api/`

**`server.ts`** boots the HTTP+WS server and mounts routes. **Routes:** `Config` (advertise registered apps/transports), `Portal` (host-facing control via `PortalRoutes`), `AppPortal` (guest management via `AppPortalRoutes`), `Static`/`Dynamic`/`Stream` (the three serve strategies' HTTP/WS endpoints), `Transitions` (transition assets/coordination shared with the client).

### 3.3 Data Model

| Entity | Key fields | Notes |
|--------|-----------|-------|
| `RegisteredApp` | `id`, `label`, `kind` (`native\|static\|dynamic\|stream`), `origin` (url:port), `serveStrategy`, `sandbox[]`, `preferredPresenter`, `defaultSize` | Source of truth = provider `AppPortalConfig`; `PortalData` is the client mirror |
| `TransportDescriptor` | `transport` (`dom-window\|texture\|stencil`), `url` (same-origin proxied/served) **or** `streamEndpoint` (WS) **or** `native:true`, `sandbox[]`, `dims` | Returned by negotiation (`/config`+`/portal`) |
| `PortalInstance` (client) | `id`, `appId`, `state` (`Dormant\|Warming\|Live\|Idle`), `engaged`, `presenter`, `quad` (projected screen rect), `transform` | Lives in `portalStore` |
| `PortalSession` (provider) | `id`, `appId`, `display: PortalDisplay`, `connector`, `clientConn` | One per live portal; owned by `PortalServer` |
| `GuestRuntime` (provider) | `appId`, `status` (`suspended\|warming\|running\|errored`), `handle`, `lastActive` | Managed by `AppPortalManager`; suspended when no portal is `Live` |

**Lifecycle (per portal):**

```
Dormant ──engage intent──▶ Warming ──guest ready──▶ Live ──disengage──▶ Idle
   ▲                          │                        │                 │
   └────────── off-screen / dispose ◀──────────────────┴── re-engage ◀───┘
Guest compute runs ONLY in Live. Idle = frozen frame; Dormant = PortalFluid placeholder.
```

### 3.4 API & Interface Design

**Client component (the one public surface most consumers touch):**

```tsx
import { Portal, PortalData } from '@layerdynamics/portal'

<Portal app="csg-playground" position={[0, 1.5, -4]} size={[3, 2]} />
```

**Provider HTTP/WS (origin-checked, allowlist-gated):**

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /config` | HTTP | List registered apps + their kinds/transports (client `config` store) |
| `GET/WS /portal/:id` | HTTP/WS | Open a portal session, negotiate, exchange lifecycle signals |
| `POST /app-portal/:appId/{warm,suspend,dispose}` | HTTP | Drive guest lifecycle (used by host control channel) |
| `GET /static/:appId/*` | HTTP | Serve a registered static build same-origin (`APStaticServe`) |
| `ALL /dynamic/:appId/*` | HTTP | Reverse-proxy / SSR a registered live app same-origin (`APDynamicServe`) |
| `WS /stream/:appId` | WS | Frame/event stream for the texture presenter (`APSocketStream`) |
| `GET /transitions/*` | HTTP | Shared transition assets/config |

**Control-channel messages (typed, validated `targetOrigin`):** `negotiate`, `warm`, `engaged`, `idle`, `dispose`, `input` (forwarded events), `state`, `error`.

### 3.5 Data Flow — "engage a registered live app, fully interactive"

1. `<Portal app="X">` mounts → `useAppPortal` registers a `PortalInstance` (`Dormant`); `PortalFluid` renders (~0 cost).
2. Visitor approaches/clicks → host signals engage intent → `connector.negotiate("X")` hits `/config`+`/portal`.
3. Provider (`AppPortalConfig`) confirms X is registered, picks a strategy (live app → `APDynamicServe`), `AppPortalManager` warms `GuestRuntime`, returns a `TransportDescriptor` = `{ transport: 'dom-window', url: '/dynamic/X/…' (same-origin proxy), sandbox: […] }`. Portal → `Warming` (`PortalTransition`).
4. Host mounts **DomWindowPresenter**: an iframe to the same-origin proxied URL, sandboxed per policy. Because it's same-origin via the provider, it is **fully interactive** and not tainted.
5. Each frame, the host projects the portal's 3D quad to screen space and sets the iframe's position/size/clip + depth ordering (`PortalEdge` draws the rim, occluders mask it). Portal → `Live`.
6. Visitor clicks/types → the browser delivers events to the real iframe natively. `AppClient` exchanges any typed `postMessage` (e.g. resize, theme).
7. Disengage / portal leaves view → host signals `idle` → provider suspends `GuestRuntime`; host freezes the last frame (`Idle`) or returns to `PortalFluid` (`Dormant`). Guest compute stops.

For **stream/native** kinds, step 3 returns `transport: 'texture'` (WS `/stream/X` → `WebGLRenderTarget`) or `transport: 'stencil'` (drei `MeshPortalMaterial`, no DOM); interaction for the texture path is via forwarded `input` messages (FR-9).

### 3.6 Integration Points

- **`apps/client` (SPEC-002), consumer #1:** the level world places `<Portal>` objects (e.g. in "Other Work" / dedicated demo levels) for registered project apps. Cross-Canvas rule from SPEC-001 still applies — the DOM iframe is a sibling DOM layer the host syncs to the projected quad, not a router-context call inside the Canvas.
- **Registered guest apps:** the owner's other apps on their own URLs/ports (Railway services, static builds, dev servers), declared in `AppPortalConfig`.
- **Railway:** provider deploys as a Node service; `/config` and same-origin proxy routes are reachable from the host origin (mind `allowedHosts`).

### 3.7 Security Architecture

- **Allowlist first:** every provider route validates `:appId`/origin against `AppPortalConfig`; unknown → 403. No open proxy, no wildcard `targetOrigin`.
- **Same-origin via provider, not blanket allow-same-origin:** interactivity for cross-origin guests is granted by proxying them onto the *provider's* origin and applying a per-app `sandbox` token set — never by handing a foreign origin `allow-same-origin` over the host.
- **Headers:** provider rewrites/sets `X-Frame-Options`/`Content-Security-Policy: frame-ancestors` on served/proxied responses so only the host origin may frame the provider.
- **Message validation:** all control/`postMessage`/WS traffic is typed and origin-checked; malformed or off-origin messages dropped.
- **Blast radius:** guest is sandboxed; a crashing/malicious-registered guest can affect only its own iframe/session, never the host scene (degrades to `Idle`/poster).

### 3.8 Resilience Design

- **Presenter fallthrough:** `dom-window → texture → poster` so a portal is never blank (FR-3).
- **Reconnect:** `PortalClient` reconnects to the provider with exponential backoff; `Dormant` portals are unaffected by provider blips.
- **Guest failure isolation:** `AppServer`/`AppPortalManager` mark a crashed guest `errored` → portal shows error poster; host loop continues.
- **Lifecycle caps:** `MAX_LIVE` + LRU demotion to `Idle` bound resource use; suspended guests release memory/CPU.
- **No-op idle:** `Idle`/`Dormant` paths have no network polling or animation frames against the guest.

### 3.9 Observability

- **Provider:** structured access logs (per registered-origin request), guest lifecycle events (`warm/suspend/dispose/error`), negotiation outcomes, WS connection counts.
- **Client:** dev overlay (behind a flag) showing each portal's `state`, chosen presenter, quad-registration error, and fps impact; console-grouped lifecycle traces.
- **Metrics worth surfacing:** warming latency, live-portal count vs `MAX_LIVE`, guest error rate, negotiation fallback rate.

### 3.10 Infrastructure & Deployment

- **Provider:** Node ESM service on **Railway** (one service). Build via Vite/tsc; start `api/server.ts`. Env: registered-app config source, allowed host origin(s), port.
- **Client:** published as `@layerdynamics/portal` within the pnpm workspace; consumed by `apps/client` and the package's own demo harness. Build splits web/node tsconfigs.
- **CI:** `tsc -b` (both projects) + lint + the test tiers in §4.2 must pass.

---

## 4. Implementation Plan

### 4.1 Build Phases

#### Phase 0 — Foundations & contracts
- **Goal:** types, config, and the empty-file skeleton filled with interfaces (no behavior).
- **Scope:** fix `AppPortalManager.ts.ts`→`.ts`; populate `package.json` deps + `tsconfig*.json`; define `RegisteredApp`/`TransportDescriptor`/lifecycle types; stub `PortalData`/`AppPortalConfig` with one example app each; the three stores' shapes.
- **Exit:** `tsc -b` green on both projects; types shared between client/provider compile.

#### Phase 1 — DOM-window presenter + provider serve (the marquee path)
- **Goal:** a registered **static or dynamic** app windowed into an R3F scene, **fully interactive**, tracking the projected quad.
- **Scope:** provider `server.ts` + `Config`/`Portal`/`Static`/`Dynamic` routes; `AppServer` (serve/proxy same-origin) + `AppPortalManager` (warm/dispose); client `connector`/`PortalClient`, `Portal.tsx`, `DomWindowPresenter`, projected-quad sync, `PortalEdge`/`PortalFluid`; the standalone demo harness mounting one portal.
- **Exit:** demo harness shows a registered app on a different port, clickable/typeable in place, quad-registered within tolerance, with allowlist enforcement.

#### Phase 2 — Lifecycle & engagement gating
- **Goal:** the `Dormant→Warming→Live→Idle` contract end-to-end with guest suspend/resume.
- **Scope:** `useAppPortal` orchestration, `portalStore` transitions + `MAX_LIVE`, `PortalTransition`, provider suspend/resume in `AppPortalManager`, `Idle` freeze-frame.
- **Exit:** an idle portal costs ~0 guest compute (verified); warming latency within targets; host fps targets met.

#### Phase 3 — Texture & stencil presenters (always-works completion)
- **Goal:** cover **streamed** and **three.js-native** kinds.
- **Scope:** `Stream/APSocketStream` + `TexturePresenter` (WS→`WebGLRenderTarget`, input forwarding for FR-9); `StencilPresenter` via drei `MeshPortalMaterial` for native worlds; presenter fallthrough.
- **Exit:** all four content kinds present a working, non-blank view; fallback path exercised.

#### Phase 4 — Portfolio integration (consumer #1) & hardening
- **Goal:** real portals in SPEC-002's level world + security/observability polish + Railway deploy.
- **Scope:** wire `<Portal>` into `apps/client`; register the owner's apps; CSP/sandbox/header hardening; dev overlay; Railway provider deploy.
- **Exit:** at least one real registered app runs live inside a level; security checks pass; deployed provider reachable from the host origin.

### 4.2 Testing Strategy

- **Unit (Vitest node):** transport negotiation logic, allowlist enforcement (registered→ok / unknown→403), lifecycle state machine, projected-quad math.
- **Component/browser (Vitest 4 + Playwright/Chromium, matching the repo's Storybook story-as-test convention):** `Portal`/`PortalEdge`/`PortalFluid`/`PortalTransition` smoke-mount; `DomWindowPresenter` mounts an iframe and tracks a moving quad; `play()` interaction asserting input reaches a same-origin test guest.
- **Integration (provider):** spin the provider with a fixture registered app; assert `/config`, same-origin serve/proxy, WS stream frame delivery, suspend/resume.
- **E2E (real, per house rule — full stack):** host R3F app → control channel → provider → real registered guest app on a separate port; assert the visitor can click/type into the windowed app and that disengaging suspends the guest. No mocked layers.
- **Security regression:** tests that an unregistered origin is refused and that off-origin `postMessage` is dropped (written *with* the allowlist/validation, per the security-fix-needs-a-test rule).

### 4.3 Rollout Strategy

- Land behind the package boundary first (demo harness), then integrate into `apps/client` behind a feature flag / single level. Each phase is independently shippable; Railway provider deploys before portfolio integration. Rollback = unmount `<Portal>` usage / disable the provider route; the rest of the site is unaffected.

### 4.4 Operational Readiness

- Provider deployed on Railway with config + allowed origins set; `/config` reachable from host.
- Dev overlay available for diagnosing quad drift / lifecycle.
- Access + lifecycle logs flowing; `MAX_LIVE` and warming-latency dashboards/alerts defined.
- Runbook for "guest unreachable" and "provider restart" degradation paths.

---

## 5. Milestones

| Milestone | Goal | Exit Criteria | Owner |
|-----------|------|---------------|-------|
| M0 Foundations | Types/config/skeleton | `tsc -b` green both projects; example app registered | Owner + Claude |
| M1 DOM-window MVP | Interactive registered app in-scene | Demo harness: cross-port app, clickable/typeable, quad-registered, allowlist-gated | Owner + Claude |
| M2 Lifecycle | Engagement gating + suspend/resume | Idle ≈ 0 guest compute; warming within targets; fps targets met | Owner + Claude |
| M3 All-works | Texture + stencil + fallthrough | All 4 content kinds present working views; fallback exercised | Owner + Claude |
| M4 Integration | Consumer #1 + deploy + hardening | Live portal in a SPEC-002 level; security tests pass; Railway provider live | Owner + Claude |

### Dependency Graph

```
M0 ──▶ M1 ──▶ M2 ──▶ M3 ──▶ M4
              │              ▲
              └── lifecycle is a prerequisite for safe multi-kind + integration
```

---

## 6. Success Criteria

### 6.1 Launch Metrics

| Metric | Target | Method |
|--------|--------|--------|
| Interactive-in-place works | A registered cross-port app is clickable/typeable inside the 3D scene | E2E test + manual |
| "Always works" coverage | All 4 content kinds render a non-blank, working view | Per-kind test |
| Idle cost | Non-engaged portal: 0 live-guest frames/network | Provider trace + profiler |
| Host fps | ≥60 desktop idle / ≥30 with one live portal | `useFrame` sampling |
| Quad registration | ≤2 px drift at rest | Measured offset |
| Allowlist | 100% of unregistered targets refused | Security test |

### 6.2 Ongoing Monitoring

Provider dashboards: warming latency p95, live-portal count vs `MAX_LIVE`, guest error/negotiation-fallback rate, WS connections. Client dev overlay for quad/lifecycle. Review cadence: per integration milestone, then on each new registered app.

### 6.3 Remediation Triggers

- Guest error rate > 5% over a session window → investigate `AppServer`/registration.
- Negotiation fallback rate > 20% → a content kind's preferred presenter is failing.
- Host fps drops below floor with a live portal → tighten `MAX_LIVE` / presenter.
- Any unregistered-origin request served (should be 0) → security incident.

---

## 7. Risks

| ID | Risk | Impact | Likelihood | Mitigation | Contingency |
|----|------|--------|-----------|------------|-------------|
| R-1 | Cross-origin pixels can't be read into WebGL; naive RTT of a foreign iframe fails | High | High (inherent) | Provider serves/proxies same-origin (DOM-window) or streams frames (texture) — never reads cross-origin pixels | Stream presenter; poster fallback |
| R-2 | Iframe rectangle can't perfectly track an oblique/curved 3D portal | High | Med | Near-planar interactive path; degrade to texture+event-forward or enter-to-use flatten (FR-9) | Enter-to-use zoom |
| R-3 | Same-origin proxying a live app breaks its absolute URLs/cookies/CSP | Med | Med | `APDynamicServe` rewrites base URLs/headers; per-app config; test against each registered app | Mark app `static`/`stream` instead |
| R-4 | Live guests blow the frame/memory budget | High | Med | Engagement-gated lifecycle + `MAX_LIVE` + suspend/resume; guests run in their own context | Lower `MAX_LIVE` to 1; freeze-frame |
| R-5 | Provider is an embedding/proxy attack surface | High | Low (allowlist) | Allowlist-only, sandbox tokens, origin-checked messaging, `frame-ancestors` | Disable route; revoke app from config |
| R-6 | Scope (full client+server+4 transports) overruns | Med | Med | Phased: ship DOM-window MVP first; later kinds are additive and independently shippable | Defer texture/stencil to a follow-up |
| R-7 | Suspended guest loses in-progress state on resume | Low | Med | Optional state persistence (FR-16); cold-reload acceptable for v1 | Document as known limitation |

---

## 8. Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| OQ-1 | Provider HTTP/WS library choice (e.g. Fastify+`ws` vs. Hono vs. raw `node:http`) — minimal, ESM, Railway-friendly | Owner | Before M0 |
| OQ-2 | Exact threshold (portal incidence angle / curvature) at which DOM-window degrades to texture/enter-to-use | Owner + Claude | During M2 |
| OQ-3 | `MAX_LIVE` default and degradation ladder for multiple engaged portals | Owner | During M2 |
| OQ-4 | Streamed-app frame transport detail (raw `ImageBitmap`/`VideoFrame` over WS vs. WebRTC vs. MJPEG) and its bandwidth/latency budget | Owner + Claude | Before M3 |
| OQ-5 | Which of the owner's apps are the first registered guests, and their kinds | Owner | Before M4 |
| OQ-6 | Default `PortalFluid`/`PortalEdge` visual treatment vs. the brand black/white/coral system | Owner | During M1 |
| OQ-7 | Does the demo harness deploy publicly, or stay a local dev surface | Owner | Before M4 |

---

## Appendices

### Appendix A — Glossary

| Term | Meaning |
|------|---------|
| **Portal** | A placed object in the host 3D scene whose aperture shows another world/app. |
| **Provider** | The Node service (`ssr/`) that makes registered guest apps presentable (serve/proxy/stream) and manages their lifecycle. |
| **Guest app / AppPortal** | A registered application (three.js-native, static, dynamic/SSR, or streamed) shown through a portal, typically on its own URL/port. |
| **Presenter** | The client-side strategy that draws a guest: `dom-window` (interactive iframe clipped to the quad), `texture` (RTT/stream), `stencil` (native world). |
| **Transport** | How the provider exposes a guest so a Presenter can show it: static serve, dynamic proxy/SSR, or socket stream. |
| **Negotiation** | The host↔provider handshake that picks a transport+presenter per app so it "always works." |
| **Projected quad** | The portal's 3D rectangle projected to 2D screen space each frame; the DOM-window guest is registered to it. |
| **Engagement-gated lifecycle** | `Dormant→Warming→Live→Idle`; guest compute runs only when `Live` (engaged). |
| **Registered app** | An owner-declared, allowlisted guest in `AppPortalConfig`/`PortalData`; the only thing a portal may point at. |

### Appendix B — Component → File Map

| Concern | Client file(s) | Provider file(s) |
|---------|----------------|------------------|
| Public portal object | `components/Portal.tsx` | `lib/Portal/PortalServer.ts`, `lib/Portal/PortalRoutes.ts`, `api/routes/Portal.ts` |
| Art-directed frame | `components/PortalEdge.tsx`, `components/PortalFluid.tsx`, `components/PortalTransition.tsx` | `api/routes/Transitions.ts` |
| Negotiation / control | `io/connector.ts`, `io/PortalClient.ts` | `lib/Portal/PortalAppConnector.ts`, `api/routes/Config.ts` |
| Guest handle / input | `io/AppClient.ts` | `lib/Portal/AppClient.ts`, `lib/AppPortal/PortalClient.ts` |
| State | `stores/portalStore.ts`, `appStore.ts`, `config.ts`, `connectorStore.ts` + `hooks/*` | — |
| Guest lifecycle/allowlist | `data/PortalData.ts` | `lib/AppPortal/AppPortalManager.ts`, `AppPortalConfig.ts`, `AppServer.ts`, `AppPortalRoutes.ts`, `api/routes/AppPortal.ts` |
| Serve strategies | (presenter selection) | `lib/AppPortal/Static/APStaticServe.ts`, `Dynamic/APDynamicServe.ts`, `Stream/APSocketStream.ts` + `api/routes/{Static,Dynamic,Stream}.ts` |
| Display model | (presenter) | `lib/Portal/PortalDisplay.ts` |
| Harness | `App.tsx`, `main.tsx`, `index.html`, `components/Layout.tsx` | `api/server.ts` |

### Appendix C — Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| D-1 | Two-sided client+provider, not a client-only lib | A cross-origin app can't be read into WebGL or framed in-context without a server to serve/proxy/stream it same-origin |
| D-2 | DOM-window (same-origin iframe clipped to projected quad) is the primary interactive presenter | Only path that delivers native click/type interaction for cross-origin apps without tainting |
| D-3 | Provider proxies guests onto its own origin rather than granting `allow-same-origin` | Grants interactivity without trusting a foreign origin with same-origin powers over the host |
| D-4 | Per-content-kind transport negotiation with presenter fallthrough | Satisfies "always works no matter the situation" across all four kinds |
| D-5 | Engagement-gated lifecycle is the performance contract | Owner requirement: "only running when engaged, otherwise idle and minimal" |
| D-6 | Registered-apps-only allowlist | Owner requirement; collapses the security surface to known origins |
| D-7 | Generic package, portfolio (SPEC-002) is consumer #1 | Owner requirement; reusable primitive proven by real integration |
