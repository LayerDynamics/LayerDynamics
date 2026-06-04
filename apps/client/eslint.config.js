import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'storybook-static']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      // Pin the parser's project root to this package. Without it, the tseslint
      // parser auto-walks the tree and finds multiple candidate roots in the
      // monorepo (apps/client + packages/portal), which the IDE's ESLint
      // integration rejects with a "multiple candidate TSConfigRootDirs" error.
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // The React Three Fiber layer drives the scene by mutating three.js objects
    // every frame inside useFrame (camera, materials, Object3D transforms) — the
    // framework's documented imperative model. That is fundamentally at odds
    // with the React Compiler's immutability/ref lints, which assume pure
    // render. Disable those two rules for the WebGL layer only; all DOM/React
    // code keeps them enabled.
    files: ['src/components/scene/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
  {
    // Storybook config + decorators. Decorators are HOCs that Storybook renders
    // as components, so calling hooks (useEffect for store seeding) inside them is
    // valid even though their names are lowercase; and a decorators/helpers module
    // is meant to export several non-component utilities. Both rules false-positive
    // here, so scope them off for the Storybook infra only.
    files: ['.storybook/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
