# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Storybook

Every rendering component in `src/` has a colocated `*.stories.tsx`. Storybook 10
(`@storybook/react-vite`) runs on the same bleeding-edge stack as the app (Vite 8,
React 19 + React Compiler), and the stories double as a **real-browser regression
test suite** via `@storybook/addon-vitest` (Vitest 4 browser mode, Playwright/Chromium).

```bash
pnpm storybook          # dev server on :6006
pnpm build-storybook    # static build -> storybook-static/ (gitignored)

pnpm test               # both Vitest projects: node unit + browser story tests
pnpm test:unit          # node-only logic tests (e.g. scrub.test.ts)
pnpm test:storybook     # browser story tests only (Chromium)
```

Conventions:

- **DOM components** (`Nav`, `HireMe/*`, `Loader`, `LensToggle`, `Level{Input,Transitions,Indicator}`)
  get interaction (`play`) assertions and `@storybook/addon-a11y` axe checks.
- **R3F scene components** mount in a real `<Canvas frameloop="always">` via the
  `withCanvas` decorator and assert **smoke-mount** (renders without throwing; live
  `<canvas>` produced) — not pixel diffs, since headless WebGL may software-render.
  The Ender 5 / logo GLTF stories additionally decode their **Draco** model
  end-to-end through the self-hosted decoder in `public/draco/`.
- Decorators live in `.storybook/decorators.tsx`: `withRouter`, `withStore`
  (zustand `useScene`), `withLevels` (`useLevels`), `withCanvas` (+ optional drei
  `ScrollControls`). The smoke-test contract is `.storybook/sceneTest.ts`.

> Note: `pnpm test` / `pnpm test:storybook` clear the Storybook dep-optimizer
> cache first (`rimraf node_modules/.cache/storybook`) so adding stories can't
> trigger a mid-run re-optimize that flakily fails the first run.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
