import type { Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'

// Global app styles so components render with the real brand fonts/tokens.
// Mirrors the chain from src/main.tsx + src/App.tsx:
//   css_reset.css -> index.css (@imports styles/theme.css) -> App.css
import '../src/styles/css_reset.css'
import '../src/index.css'
import '../src/App.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    backgrounds: {
      default: 'brand-dark',
      values: [
        { name: 'brand-dark', value: '#0b0a14' },
        { name: 'brand-mid', value: '#171526' },
        { name: 'light', value: '#ede6ff' },
      ],
    },
    a11y: {
      // Surface violations in the a11y panel without failing the test run by
      // default; per-story can override to 'error' once triaged.
      test: 'todo',
    },
    layout: 'fullscreen',
  },
  decorators: [
    withThemeByClassName({
      themes: { dark: 'theme-dark', light: 'theme-light' },
      defaultTheme: 'dark',
    }),
  ],
}

export default preview
