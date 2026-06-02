import { useGLTF } from '@react-three/drei'

// Serve the Draco decoder from our own origin (public/draco/) instead of drei's
// default Google gstatic CDN. The only Draco-compressed asset is the Ender 5 GLB
// (3D Printing level); self-hosting the decoder removes the third-party runtime
// dependency (works offline, no cross-origin fetch).
//
// This MUST run before any module evaluates `useGLTF.preload(...)` at import time
// (PrintingLevel / Ender5Pro do), otherwise the loader locks in the default CDN
// path first. main.tsx imports this module BEFORE App, so the path is set before
// the App import graph (and its preloads) is evaluated.
useGLTF.setDecoderPath('/draco/')
