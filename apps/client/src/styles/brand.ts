// Brand colors as plain values for the WebGL / TSX side (kept in sync with
// src/styles/theme.css). Three.js accepts these hex strings directly.
import type { Tier } from '../data/projects'

export const brand = {
  bg0: '#000000',
  bg1: '#050507',
  bg2: '#0c0c10',
  violetDeep: '#e0452e', // deep coral
  violet: '#ff6750', // the accent
  violetSoft: '#ff9d8a', // light coral
  lavender: '#ffffff', // secondary highlight → white
  cyan: '#ffffff', // secondary accent → white
} as const

export const tierColor: Record<Tier, string> = {
  flagship: '#ff6750',
  strong: '#ff9d8a',
  notable: '#d8d8e0',
}
