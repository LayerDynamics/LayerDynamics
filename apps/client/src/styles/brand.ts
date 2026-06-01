// Brand colors as plain values for the WebGL / TSX side (kept in sync with
// src/styles/theme.css). Three.js accepts these hex strings directly.
import type { Tier } from '../data/projects'

export const brand = {
  bg0: '#0b0a14',
  bg1: '#12101f',
  bg2: '#171526',
  violetDeep: '#7e14ff',
  violet: '#863bff',
  violetSoft: '#aa3bff',
  lavender: '#ede6ff',
  cyan: '#47bfff',
} as const

export const tierColor: Record<Tier, string> = {
  flagship: '#aa3bff',
  strong: '#6b6bff',
  notable: '#47bfff',
}
