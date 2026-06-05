import type { PortalDataEntry } from '../../shared/contract'

/** UI-facing catalog of placeable portals. Mirrors AppPortalConfig ids; the
 *  provider remains the security source of truth (origin/sandbox live there). */
export const PORTAL_DATA: PortalDataEntry[] = [
  {
    id: 'wasmos',
    label: 'WASM_OS',
    kind: 'dynamic',
    preferredPresenter: 'dom-window',
    defaultSize: [4, 2.6],
    description:
      'Experimental OS in a browser tab: a WASM microkernel scheduling WASI processes, a Unix userland + windowed compositor, and a nested riscv64 Linux. A proof of concept.',
    repoUrl: 'https://github.com/LayerDynamics/wasm_os',
  },
  {
    id: 'forge',
    label: 'Forge',
    kind: 'dynamic',
    preferredPresenter: 'dom-window',
    defaultSize: [4, 2.6],
    description:
      'Forge is an Electron-like desktop application framework using Rust and Deno. Apps are 100% TypeScript/JavaScript - no per-app Rust required. The runtime provides native system access through a secure, capability-based API.',
    repoUrl: 'https://github.com/LayerDynamics/forge',
    siteUrl: 'https://forge-deno.com',
  },
  { id: 'demo-static', label: 'Demo Static Build', kind: 'static', preferredPresenter: 'dom-window', defaultSize: [3, 2] },
  { id: 'demo-dynamic', label: 'Demo Live App', kind: 'dynamic', preferredPresenter: 'dom-window', defaultSize: [3.2, 2] },
  { id: 'demo-stream', label: 'Demo Streamed App', kind: 'stream', preferredPresenter: 'texture', defaultSize: [2.4, 1.6] },
  { id: 'demo-native', label: 'Demo Native World', kind: 'native', preferredPresenter: 'stencil', defaultSize: [2.5, 2.5] },
]

const BY_ID = new Map(PORTAL_DATA.map((e) => [e.id, e]))
export function getPortalData(id: string): PortalDataEntry | undefined {
  return BY_ID.get(id)
}
