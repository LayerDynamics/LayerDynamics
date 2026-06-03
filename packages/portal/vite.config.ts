import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The harness proxies provider routes so the guest iframe is same-origin in dev
// (interactive + untainted). The provider runs on :5179; harness on :5183.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    proxy: {
      '/static': 'http://localhost:5179',
      '/dynamic': 'http://localhost:5179',
      '/config': 'http://localhost:5179',
      '/app-portal': 'http://localhost:5179',
      '/portal': { target: 'ws://localhost:5179', ws: true },
    },
  },
})
