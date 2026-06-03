import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

/**
 * Security regression gate for the Discord webhook leak.
 *
 * The Discord webhook URL is a write-capable secret. It must NEVER ship in the
 * client bundle (a static SPA serves its JS to every visitor, so anything Vite
 * inlines is public). Delivery is proxied through the portal provider, which
 * holds the webhook server-side.
 *
 * Vite only inlines `import.meta.env.VITE_*` references that appear in source,
 * plus any hard-coded string literals. So the bundle is provably webhook-free
 * iff the source (a) never reads `VITE_DISCORD_WEBHOOK_URL` and (b) contains no
 * `discord.com/api/webhooks` literal. We assert both over all of src/ — a fast,
 * deterministic check that doesn't depend on a build env. As a belt-and-braces
 * step, if a built dist/ exists we grep it for the webhook host too.
 */

const SRC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DIST_DIR = resolve(SRC_DIR, '../dist')

const WEBHOOK_HOST = 'discord.com/api/webhooks'
const WEBHOOK_ENV = 'VITE_DISCORD_WEBHOOK_URL'

/** This test file references both forbidden strings (above and here), so exclude
 *  it from its own scan to avoid a self-trigger. */
const SELF = fileURLToPath(import.meta.url)

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

describe('Discord webhook never reaches the client bundle', () => {
  const sourceFiles = walk(SRC_DIR).filter((f) => f !== SELF)

  it('no source file reads the webhook env var', () => {
    const offenders = sourceFiles.filter((f) => readFileSync(f, 'utf8').includes(WEBHOOK_ENV))
    expect(offenders, `${WEBHOOK_ENV} must not be referenced in client source`).toEqual([])
  })

  it('no source file hard-codes a Discord webhook URL', () => {
    const offenders = sourceFiles.filter((f) => readFileSync(f, 'utf8').includes(WEBHOOK_HOST))
    expect(offenders, `"${WEBHOOK_HOST}" must not appear in client source`).toEqual([])
  })

  it('the built bundle (if present) contains no webhook URL', () => {
    if (!existsSync(DIST_DIR)) return
    const offenders = walk(DIST_DIR).filter((f) => readFileSync(f, 'utf8').includes(WEBHOOK_HOST))
    expect(offenders, `"${WEBHOOK_HOST}" leaked into the built bundle`).toEqual([])
  })
})
