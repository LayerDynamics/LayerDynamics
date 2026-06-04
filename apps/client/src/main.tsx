import './styles/css_reset.css'
import './draco' // self-host the Draco decoder — MUST precede the App import (see draco.ts)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Globals } from '@react-spring/web'
import { raf } from '@react-spring/rafz'
import './index.css'
import App from './App.tsx'

// @react-spring/three (used by the 3D scene) sets the SHARED react-spring frame
// loop to "demand" at import time — it only advances inside an R3F Canvas. That
// stalls @react-spring/web springs on Canvas-less routes (e.g. /projects/:id) and
// DOM overlays, leaving them frozen at their `from` state (opacity 0). Force the
// continuous rAF loop
// back on so web springs animate everywhere; the three integration still ticks
// correctly under "always". This runs after the App import graph (where
// @react-spring/three assigns "demand"), so it wins.
Globals.assign({ frameLoop: 'always' })

// @react-spring/three registers an R3F per-frame effect (addEffect(() =>
// raf.advance())) to drive springs in "demand" mode. Under our forced "always"
// loop, rafz's own continuous rAF already ticks every spring, so that manual
// advance is redundant — and rafz warns once per frame ("Cannot call the manual
// advancement of rafz whilst frameLoop is not set as demand"), flooding the
// console. Guard advance so it only does work in "demand" mode and is a silent
// no-op otherwise; this stays correct if the loop ever flips back to demand.
const advanceRaf = raf.advance
raf.advance = () => {
  if (raf.frameLoop === 'demand') advanceRaf()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
