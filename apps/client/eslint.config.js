import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
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
])
