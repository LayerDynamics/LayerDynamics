// Brand colors as plain values for the WebGL / TSX side (kept in sync with
// src/styles/theme.css). Three.js accepts these hex strings directly.
import type { Tier } from '../data/projects'
import type { LanguageId } from '../data/languages'

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

/** Per-tech brand colors for the Languages level. `base` tints the extruded logo
 *  GLB (material override) and the page accent; `accent` is the secondary highlight
 *  (emissive on hover / the page tint). Values are the canonical brand hexes. */
export interface LangColor {
  base: string
  accent: string
}

export const langColor: Record<LanguageId, LangColor> = {
  python: { base: '#3776AB', accent: '#FFD43B' },
  rust: { base: '#DEA584', accent: '#F74C00' },
  typescript: { base: '#3178C6', accent: '#3178C6' },
  deno: { base: '#E5E7EB', accent: '#E5E7EB' },
  webassembly: { base: '#654FF0', accent: '#654FF0' },
}
