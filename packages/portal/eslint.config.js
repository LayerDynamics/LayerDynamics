import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'ssr/fixtures', 'e2e', 'playwright.config.ts']),

  // Honor the universal "underscore prefix = intentionally unused" convention for
  // args and caught errors (e.g. `(_url, _init) => …` placeholder mock signatures),
  // matching TS's own `noUnusedParameters` handling. The plugin is bound here so
  // the rule resolves regardless of which extends-block a file falls under.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      // Pin the parser's project root to this package. Without it, the tseslint
      // parser auto-walks the tree and finds multiple candidate roots in the
      // monorepo (apps/client + packages/portal), which the IDE's ESLint
      // integration rejects with a "multiple candidate TSConfigRootDirs" error.
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // Client (browser / React Three Fiber) code under src/.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // The R3F presenter layer mutates three.js objects every frame inside useFrame
  // (iframe rect sync, texture upload, material updates) — the framework's
  // imperative model, at odds with the React Compiler immutability/ref lints.
  // Disable those two for the WebGL layer only; DOM/React code keeps them on.
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },

  // Provider (Node) code under ssr/ — no React, Node globals.
  {
    files: ['ssr/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Environment-agnostic contract under shared/.
  {
    files: ['shared/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
])
