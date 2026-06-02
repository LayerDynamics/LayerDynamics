import type { StorybookConfig } from '@storybook/react-vite'
import { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

/**
 * Storybook for apps/client.
 *
 * The project's prod build (vite.config.ts) compiles every component with the
 * React Compiler via `@rolldown/plugin-babel` + `reactCompilerPreset()`.
 * Storybook's react-vite builder runs `@vitejs/plugin-react` on its own but
 * NOT the compiler, so we re-add the same babel plugin in `viteFinal` to keep
 * Storybook parity with production (Risk R3 in the plan).
 *
 * `staticDirs` serves `public/` so `/assets/*` GLTF models and the self-hosted
 * `/draco/` decoder resolve in stories the same way they do in the app.
 */
const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-vitest',
  ],
  staticDirs: ['../public'],
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = viteConfig.plugins ?? []
    // Mirror vite.config.ts: run the React Compiler over the same sources.
    viteConfig.plugins.push(babel({ presets: [reactCompilerPreset()] }))

    // Pre-bundle the R3F ecosystem so the dep optimizer doesn't discover them
    // mid-test and force a reload (which fails the @storybook/addon-vitest
    // browser run with "Failed to fetch dynamically imported module").
    viteConfig.optimizeDeps = viteConfig.optimizeDeps ?? {}
    viteConfig.optimizeDeps.include = [
      ...(viteConfig.optimizeDeps.include ?? []),
      'three',
      'three-stdlib',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'postprocessing',
      '@react-spring/three',
      '@react-spring/web',
    ]
    // Crawl every story + the preview up front so the optimizer discovers all
    // transitive deps (drei's lazy DRACOLoader/postprocessing imports, etc.) at
    // startup instead of mid-test. Without this, adding a batch of stories makes
    // Vite re-optimize on first run and reload tests, failing them flakily on a
    // cold cache ("Failed to fetch dynamically imported module").
    viteConfig.optimizeDeps.entries = [
      ...(typeof viteConfig.optimizeDeps.entries === 'string'
        ? [viteConfig.optimizeDeps.entries]
        : (viteConfig.optimizeDeps.entries ?? [])),
      'src/**/*.stories.@(ts|tsx)',
      '.storybook/preview.tsx',
    ]
    // Single Three.js instance — silences "Multiple instances of Three.js".
    viteConfig.resolve = viteConfig.resolve ?? {}
    viteConfig.resolve.dedupe = [...(viteConfig.resolve.dedupe ?? []), 'three']

    return viteConfig
  },
}

export default config
