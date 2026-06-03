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
}

/** Orchestrates one portal: registers it, negotiates its transport over HTTP,
 *  opens the lifecycle WebSocket, and exposes engage()/idle() that drive the
 *  state machine on both sides. A guest only runs while engaged (state 'live'). */
export function useAppPortal(appId: string, providerOrigin: string): UseAppPortal {
  const id = useId()
  const register = usePortalStore((s) => s.register)
  const setState = usePortalStore((s) => s.setState)
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
      if (msg.type === 'state') setState(id, msg.state)
      else if (msg.type === 'error') setState(id, 'dormant')
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
  }, [id, appId, providerOrigin, register, setState, setTransport, remove, setConnStatus])

  const engage = useCallback(() => {
    setState(id, 'warming')
    clientRef.current?.send({ type: 'warm', portalId: id, appId })
  }, [id, appId, setState])

  const idle = useCallback(() => {
    setState(id, 'idle')
    clientRef.current?.send({ type: 'idle', portalId: id })
  }, [id, setState])

  return {
    id,
    state: instance?.state ?? 'dormant',
    transport: instance?.transport ?? null,
    engage,
    idle,
  }
}
