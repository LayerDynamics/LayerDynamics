import './styles/css_reset.css'
import './draco' // self-host the Draco decoder — MUST precede the App import (see draco.ts)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Globals } from '@react-spring/web'
import './index.css'
import App from './App.tsx'

// @react-spring/three (used by the 3D scene) sets the SHARED react-spring frame
// loop to "demand" at import time — it only advances inside an R3F Canvas. That
// stalls @react-spring/web springs on Canvas-less routes (e.g. /hire), leaving
// them frozen at their `from` state (opacity 0). Force the continuous rAF loop
// back on so web springs animate everywhere; the three integration still ticks
// correctly under "always". This runs after the App import graph (where
// @react-spring/three assigns "demand"), so it wins.
Globals.assign({ frameLoop: 'always' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
