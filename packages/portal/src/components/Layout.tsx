import type { ReactNode } from 'react'

/** Full-bleed fixed wrapper for the standalone demo harness. */
export function Layout({ children }: { children: ReactNode }) {
  return <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }}>{children}</div>
}
