import type { AppPortalConfigEntry } from '../../../shared/contract'
import { REGISTERED_APPS, getApp } from './AppPortalConfig'

/** Registry of guest apps. M0: registration + lookup. M2 adds warm/suspend/resume. */
export class AppPortalManager {
  private readonly apps = new Map<string, AppPortalConfigEntry>()

  constructor(entries: AppPortalConfigEntry[] = REGISTERED_APPS) {
    for (const e of entries) this.apps.set(e.id, e)
  }

  has(id: string): boolean {
    return this.apps.has(id)
  }

  get(id: string): AppPortalConfigEntry | undefined {
    return this.apps.get(id) ?? getApp(id)
  }

  list(): AppPortalConfigEntry[] {
    return [...this.apps.values()]
  }
}
