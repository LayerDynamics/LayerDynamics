import type { AppPortalConfigEntry } from '../../../shared/contract'
import { REGISTERED_APPS } from './AppPortalConfig'
import { AppServer } from './AppServer'

/** Registry + lifecycle owner for guest apps. Holds the allowlist (registration
 *  + lookup) and the running-guest runtimes, suspending the least-recently-
 *  engaged when the live count would exceed the cap — the provider side of the
 *  engagement-gated contract (mirrors the client's MAX_LIVE). */
export class AppPortalManager {
  private readonly apps = new Map<string, AppPortalConfigEntry>()
  private readonly runtimes = new Map<string, AppServer>()
  private readonly engagedAt = new Map<string, number>()
  private readonly cap: number

  constructor(entries: AppPortalConfigEntry[] = REGISTERED_APPS, cap = 1) {
    for (const e of entries) this.apps.set(e.id, e)
    this.cap = cap
  }

  has(id: string): boolean {
    return this.apps.has(id)
  }

  get(id: string): AppPortalConfigEntry | undefined {
    return this.apps.get(id)
  }

  list(): AppPortalConfigEntry[] {
    return [...this.apps.values()]
  }

  runtime(id: string): AppServer | undefined {
    return this.runtimes.get(id)
  }

  liveCount(): number {
    return [...this.runtimes.values()].filter((r) => r.status === 'running').length
  }

  /** Begin warming a registered guest. Throws for unregistered ids (allowlist). */
  warm(id: string): AppServer {
    const entry = this.apps.get(id)
    if (!entry) throw new Error(`unregistered app: ${id}`)
    let rt = this.runtimes.get(id)
    if (!rt) {
      rt = new AppServer(entry)
      this.runtimes.set(id, rt)
    }
    if (rt.status === 'suspended') rt.resume()
    else rt.warm()
    return rt
  }

  /** Mark a warmed guest as running and enforce the live cap. */
  markRunning(id: string, now = Date.now()): void {
    const rt = this.runtimes.get(id)
    if (!rt) return
    rt.markRunning()
    this.engagedAt.set(id, now)
    this.enforceCap()
  }

  suspend(id: string): void {
    this.runtimes.get(id)?.suspend()
  }

  dispose(id: string): void {
    this.runtimes.get(id)?.suspend()
    this.runtimes.delete(id)
    this.engagedAt.delete(id)
  }

  private enforceCap(): void {
    const live = [...this.runtimes.entries()].filter(([, r]) => r.status === 'running')
    if (live.length <= this.cap) return
    live
      .sort((a, b) => (this.engagedAt.get(b[0]) ?? 0) - (this.engagedAt.get(a[0]) ?? 0))
      .slice(this.cap)
      .forEach(([id]) => this.suspend(id))
  }
}
