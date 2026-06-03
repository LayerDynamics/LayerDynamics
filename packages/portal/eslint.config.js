import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'ssr/fixtures']),

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
