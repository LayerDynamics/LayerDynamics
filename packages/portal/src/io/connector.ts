import type { TransportDescriptor } from '../../shared/contract'

/** HTTP negotiation: ask the provider how to present `appId`. Returns null if the
 *  provider refuses (unregistered) — the caller then shows the dormant placeholder. */
export async function negotiate(
  providerOrigin: string,
  portalId: string,
  appId: string,
): Promise<TransportDescriptor | null> {
  const url = `${providerOrigin}/portal/${encodeURIComponent(portalId)}?app=${encodeURIComponent(appId)}`
  const res = await fetch(url)
  if (!res.ok) return null
  const body = (await res.json()) as { transport: TransportDescriptor }
  return body.transport
}

/** Resolve a provider-relative transport URL to an absolute one for the iframe src. */
export function resolveUrl(providerOrigin: string, t: TransportDescriptor): string | undefined {
  return t.url ? new URL(t.url, providerOrigin).toString() : undefined
}
