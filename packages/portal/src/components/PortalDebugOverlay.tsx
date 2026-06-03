import { usePortalStore } from '../stores/portalStore'
import { selectPresenter } from './lib/selectPresenter'

const boxStyle: React.CSSProperties = {
  position: 'fixed',
  top: 8,
  left: 8,
  zIndex: 9999,
  font: '12px ui-monospace, monospace',
  color: '#ff6750',
  background: 'rgba(10,10,10,0.8)',
  padding: '8px 10px',
  borderRadius: 6,
  pointerEvents: 'none',
  maxWidth: 320,
}

/** DOM diagnostics overlay (outside the Canvas). Lists every mounted portal with
 *  its lifecycle state, the presenter that would render it, and its projected
 *  screen-quad size — for diagnosing quad drift / lifecycle. Off unless `debug`. */
export function PortalDebugOverlay({ debug = false }: { debug?: boolean }) {
  const portals = usePortalStore((s) => s.portals)
  if (!debug) return null
  const rows = Object.values(portals)
  return (
    <div style={boxStyle} data-testid="portal-debug-overlay">
      <strong>portals: {rows.length}</strong>
      {rows.map((p) => {
        const presenter = p.transport ? selectPresenter(p.transport) : '—'
        const quad = p.quad ? `${Math.round(p.quad.w)}×${Math.round(p.quad.h)}${p.quad.visible ? '' : ' (off)'}` : '—'
        return (
          <div key={p.id} data-portal-id={p.id}>
            {p.appId} · {p.state} · {presenter} · {quad}
          </div>
        )
      })}
    </div>
  )
}
