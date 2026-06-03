import type { AppPortalConfigEntry } from '../../../shared/contract'

export type AppServerStatus = 'idle' | 'warming' | 'running' | 'errored'

/** Represents one guest app's serve session. M1: reachability + status.
 *  M2 extends this with suspend/resume for the engagement-gated lifecycle. */
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

  markErrored(): void {
    this.status = 'errored'
  }
}
