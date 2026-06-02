import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import storybookTest from '@storybook/addon-vitest/vitest-plugin'

/**
 * Two isolated Vitest projects (Risk R4 — keep the existing node unit test from
 * colliding with the new browser story tests):
 *
 *  - `unit`      — node environment, the pre-existing logic tests
 *                  (e.g. src/components/scene/PrintingLevel/scrub.test.ts).
 *  - `storybook` — real Chromium (Playwright) browser, runs every *.stories.tsx
 *                  as a test via @storybook/addon-vitest. This is where R3F/WebGL
 *                  components actually render. Scene stories assert smoke-mount
 *                  ("renders without throwing"); DOM stories run play() + a11y.
 *
 * `pnpm test` runs both. Use --project unit / --project storybook to scope.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['src/**/*.stories.*'],
        },
      },
      {
        // Since Storybook 10.3, @storybook/addon-vitest auto-applies the preview
        // annotations (.storybook/preview) to every story test — no setup file
        // or setProjectAnnotations() call is needed.
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'storybook',
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
