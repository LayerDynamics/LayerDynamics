import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { negotiate, resolveUrl, getPortalData } from '@layerdynamics/portal'
import { usePortalOverlay } from '../../stores/usePortalOverlay'
import './PortalOverlay.css'

type Phase = 'loading' | 'ready' | 'error'

/**
 * The DOM overlay that shows a registered site live within the portfolio. It is a
 * Canvas sibling (mounted in Landing, like HireMeOverlay): the in-scene
 * PortalShowcase captures the click and sets usePortalOverlay; this negotiates the
 * site URL through the portal provider and renders it large in an interactive
 * iframe over a dimmed backdrop. Esc / backdrop / close button dismiss it.
 *
 * Marked [data-level-overlay] so LevelInput lets the user interact with the site
 * instead of driving level navigation while the overlay is open.
 */
export default function PortalOverlay() {
  const openApp = usePortalOverlay((s) => s.openApp)
  const providerOrigin = usePortalOverlay((s) => s.providerOrigin)
  const close = usePortalOverlay((s) => s.close)
  const negotiateId = useId()

  // One async result keyed by the app it was negotiated for. phase/url/sandbox are
  // DERIVED (loading until the result matches the currently-open app), so the
  // effect only calls setState inside its async callbacks — never synchronously.
  const [result, setResult] = useState<{
    app: string
    ok: boolean
    url?: string
    sandbox?: string
  } | null>(null)

  // Negotiate the site URL whenever a new app is opened.
  useEffect(() => {
    if (!openApp || !providerOrigin) return
    let cancelled = false
    negotiate(providerOrigin, negotiateId, openApp)
      .then((t) => {
        if (cancelled) return
        const resolved = t ? resolveUrl(providerOrigin, t) : undefined
        setResult({
          app: openApp,
          ok: !!resolved,
          url: resolved,
          sandbox: (t?.sandbox ?? []).join(' '),
        })
      })
      .catch(() => {
        if (!cancelled) setResult({ app: openApp, ok: false })
      })
    return () => {
      cancelled = true
    }
  }, [openApp, providerOrigin, negotiateId])

  // Derived view state — no setState during render or synchronously in an effect.
  const current = result && result.app === openApp ? result : null
  const phase: Phase = current ? (current.ok ? 'ready' : 'error') : 'loading'
  const url = current?.url ?? null
  const sandbox = current?.sandbox ?? ''

  // Esc closes; lock body scroll while open.
  useEffect(() => {
    if (!openApp) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openApp, close])

  if (!openApp) return null
  const data = getPortalData(openApp)
  const label = data?.label ?? openApp
  const repoUrl = data?.repoUrl
  const siteUrl = data?.siteUrl

  // Portal to <body> so the modal escapes the `.landing` stacking context
  // (position:fixed there) and renders above the Nav and every scene layer.
  return createPortal(
    <div className="portal-overlay" data-level-overlay onPointerDown={close}>
      <div
        className="portal-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="portal-overlay__bar">
          <span className="portal-overlay__title">{label}</span>
          <div className="portal-overlay__actions">
            {siteUrl && (
              <a
                className="portal-overlay__site"
                href={siteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Go to site ↗
              </a>
            )}
            {repoUrl && (
              <a
                className="portal-overlay__repo"
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
              >
                View repo ↗
              </a>
            )}
            <button className="portal-overlay__close" onClick={close} aria-label="Close">
              ×
            </button>
          </div>
        </header>

        <div className="portal-overlay__body">
          {phase === 'ready' && url && (
            <iframe
              className="portal-overlay__frame"
              src={url}
              sandbox={sandbox}
              title={label}
              // cross-origin-isolated lets a guest that uses SharedArrayBuffer
              // (e.g. WASM_OS) inherit isolation — only effective when the host
              // page itself is cross-origin isolated (COOP/COEP on the serve).
              allow="fullscreen; clipboard-read; clipboard-write; cross-origin-isolated"
            />
          )}
          {phase === 'loading' && <p className="portal-overlay__msg">Opening {label}…</p>}
          {phase === 'error' && (
            <p className="portal-overlay__msg">
              Couldn’t open {label}. The provider may be unreachable.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
