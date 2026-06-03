import { useCallback, useEffect, useId, useRef } from 'react'
import type { PortalState, TransportDescriptor } from '../../shared/contract'
import { negotiate } from '../io/connector'
import { PortalClient } from '../io/PortalClient'
import { usePortalStore } from '../stores/portalStore'
import { useConnectorStore } from '../stores/connectorStore'

export interface UseAppPortal {
  id: string
  state: PortalState
  transport: TransportDescriptor | null
  engage: () => void
  idle: () => void
  /** Called by the visibility driver: demotes/suspends when off-screen, resumes
   *  only a previously-engaged (idle) portal when back on-screen. */
  notifyVisibility: (visible: boolean) => void
}

/** Orchestrates one portal: registers it, negotiates its transport over HTTP,
 *  opens the lifecycle WebSocket, and exposes engage()/idle() that drive the
 *  state machine on both sides. A guest only runs while engaged (state 'live'). */
export function useAppPortal(appId: string, providerOrigin: string): UseAppPortal {
  const id = useId()
  const register = usePortalStore((s) => s.register)
  const transition = usePortalStore((s) => s.transition)
  const setTransport = usePortalStore((s) => s.setTransport)
  const remove = usePortalStore((s) => s.remove)
  const setConnStatus = useConnectorStore((s) => s.setStatus)
  const instance = usePortalStore((s) => s.portals[id])
  const clientRef = useRef<PortalClient | null>(null)

  useEffect(() => {
    register(id, appId)
    let cancelled = false
    const client = new PortalClient(providerOrigin, id)
    clientRef.current = client
    setConnStatus(id, 'connecting')

    const off = client.on((msg) => {
      // Provider confirms the guest is live → complete warming→live.
      if (msg.type === 'state' && msg.state === 'live') transition(id, 'ready')
      else if (msg.type === 'error') transition(id, 'disengage')
    })

    void negotiate(providerOrigin, id, appId)
      .then((t) => {
        if (cancelled || !t) return
        setTransport(id, t)
      })
      .catch(() => {
        // Provider unreachable / refused — stay dormant (placeholder shows).
        if (!cancelled) setConnStatus(id, 'error')
      })

    client.connect()
    setConnStatus(id, 'open')

    return () => {
      cancelled = true
      off()
      client.dispose()
      clientRef.current = null
      remove(id)
    }
  }, [id, appId, providerOrigin, register, transition, setTransport, remove, setConnStatus])

  const engage = useCallback(() => {
    transition(id, 'engage')
    clientRef.current?.send({ type: 'warm', portalId: id, appId })
  }, [id, appId, transition])

  const idle = useCallback(() => {
    transition(id, 'disengage')
    clientRef.current?.send({ type: 'idle', portalId: id })
  }, [id, transition])

  const notifyVisibility = useCallback(
    (visible: boolean) => {
      const cur = usePortalStore.getState().portals[id]?.state
      if (visible) {
        // Resume only a portal that was engaged then idled (never auto-run a
        // dormant one — that would violate "only running when engaged").
        if (cur === 'idle') {
          transition(id, 'onscreen')
          clientRef.current?.send({ type: 'warm', portalId: id, appId })
        }
      } else if (cur === 'live' || cur === 'warming') {
        transition(id, 'offscreen')
        clientRef.current?.send({ type: 'idle', portalId: id })
      } else if (cur === 'idle') {
        transition(id, 'offscreen') // idle → dormant, fully releases
      }
    },
    [id, appId, transition],
  )

  return {
    id,
    state: instance?.state ?? 'dormant',
    transport: instance?.transport ?? null,
    engage,
    idle,
    notifyVisibility,
  }
}
