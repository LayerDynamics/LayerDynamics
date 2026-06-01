import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // Production preview server (used by the Railway deploy — see railway.toml).
  // Vite 8 blocks requests whose Host header isn't allow-listed; permit the
  // Railway-assigned domains so the deployed site serves. Add any custom
  // domain here too. `host: true` binds 0.0.0.0 so the container is reachable.
  preview: {
    host: true,
    allowedHosts: ['.up.railway.app', '.railway.app'],
  },
})
