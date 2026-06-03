import { defineConfig } from '@playwright/test'

/** Full-stack E2E: boots the REAL provider (5179) and the REAL Vite harness
 *  (5183, which proxies guest routes to the provider same-origin). No mocked
 *  layers — every request the visitor makes runs through the actual system. */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:5183' },
  webServer: [
    {
      command: 'pnpm dev:server',
      url: 'http://localhost:5179/healthz',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'pnpm dev:client',
      url: 'http://localhost:5183',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
