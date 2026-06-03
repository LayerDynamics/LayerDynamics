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
