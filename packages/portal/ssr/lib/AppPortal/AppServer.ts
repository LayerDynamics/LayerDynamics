import type { AppPortalConfigEntry } from '../../../shared/contract'

export type AppServerStatus = 'idle' | 'warming' | 'running' | 'suspended' | 'errored'

/** Represents one guest app's serve session. Tracks the lifecycle status the
 *  provider uses to decide whether a guest's resources are held (running) or
 *  released (suspended) — the server side of the engagement-gated contract. */
export class AppServer {
  readonly entry: AppPortalConfigEntry
  status: AppServerStatus = 'idle'

  constructor(entry: AppPortalConfigEntry) {
    this.entry = entry
  }

  warm(): void {
    if (this.status !== 'running') this.status = 'warming'
  }

  markRunning(): void {
    this.status = 'running'
  }

  /** Release the guest's compute when no portal holds it live. */
  suspend(): void {
    if (this.status === 'running' || this.status === 'warming') this.status = 'suspended'
  }

  /** Re-acquire a suspended guest when a portal re-engages. */
  resume(): void {
    if (this.status === 'suspended') this.status = 'running'
  }

  markErrored(): void {
    this.status = 'errored'
  }
}
