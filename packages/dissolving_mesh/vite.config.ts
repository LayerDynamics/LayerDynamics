import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone demo server for visually checking the dissolve effect (`pnpm dev`).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5184,
  },
})
