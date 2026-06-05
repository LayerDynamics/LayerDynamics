import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  // Pre-bundle the three/R3F graph (incl. the GLTFExporter example module the GLB test
  // round-trips through) up front. Without this the optimizer discovers them mid-run and
  // reloads the worker — the flaky "Vite unexpectedly reloaded a test" + "multiple
  // instances of Three.js" warnings — so runs become non-deterministic.
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/exporters/GLTFExporter.js',
      '@react-three/fiber',
      '@react-three/drei',
      'vitest-browser-react',
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.unit.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
