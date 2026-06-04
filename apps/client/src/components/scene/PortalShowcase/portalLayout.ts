/** One placed portal card: world-space center + [w,h] size. */
export interface PortalSlot {
  position: [number, number, number]
  size: [number, number]
}

// otherWork camera frames a 12.6 × 9.5 world box (useLevels.ts). Keep cards inside it.
const FRAME_W = 12.6
const FRAME_H = 9.5
const Z = 0.6 // matches PortalShowcase default depth

/**
 * Lay out `n` portal cards responsively. Landscape (aspect >= 1) → a single row,
 * cards sized to share the frame width with a gap. Portrait (aspect < 1) → a single
 * column, cards sized to share the frame height. Cards keep the WASM_OS aspect
 * (~4:2.6) and never exceed the frame, so the contain-fit LevelCamera holds and
 * cards scale UP on a phone instead of being crushed.
 */
export function portalLayout(n: number, aspect: number): PortalSlot[] {
  const portrait = aspect < 1
  const gap = 0.6
  const cardAspect = 4 / 2.6
  const slots: PortalSlot[] = []

  if (portrait) {
    // Stack: span ~the full frame width so cards scale UP on a phone (CLAUDE.md
    // "keep the content's world width ~constant so the camera framing holds and
    // cards scale up instead of crushing"). Card aspect goes wide/short here — the
    // height is divided across the column, the width is NOT derived from it.
    const w = FRAME_W * 0.9
    const h = (FRAME_H - gap * (n - 1)) / n
    const total = h * n + gap * (n - 1)
    for (let i = 0; i < n; i++) {
      const y = total / 2 - h / 2 - i * (h + gap)
      slots.push({ position: [0, y, Z], size: [w, h] })
    }
  } else {
    // Row: divide frame width; cap card height to ~92% of frame height.
    const w = Math.min((FRAME_W - gap * (n - 1)) / n, FRAME_H * 0.92 * cardAspect)
    const h = w / cardAspect
    const total = w * n + gap * (n - 1)
    for (let i = 0; i < n; i++) {
      const x = -total / 2 + w / 2 + i * (w + gap)
      slots.push({ position: [x, 0, Z], size: [w, h] })
    }
  }
  return slots
}
