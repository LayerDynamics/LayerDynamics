import type { WebGLRenderer } from 'three'
import { expect } from 'storybook/test'

type GlCanvas = HTMLCanvasElement & { __r3fGl?: WebGLRenderer }

/**
 * The smoke-mount contract for R3F/WebGL scene stories (plan Risk R1).
 *
 * Headless WebGL on this machine can fall back to software rendering, so scene
 * story-tests assert the component *mounts, renders, and actually draws* — NOT
 * pixel diffs (which need a real GPU and are out of scope for CI). Two checks:
 *
 *  1. R3F produced a live `<canvas>` with a non-zero drawing buffer.
 *  2. The renderer issued draw calls (cumulative `gl.info.render.calls > 0`).
 *     This catches a scene that mounts without throwing but renders nothing
 *     visible — e.g. content framed entirely off-screen — which check (1) alone
 *     would pass. `calls` (not `triangles`) is used so point-cloud / line / Edges
 *     scenes (Starfield, the processing point system) count too. The decorator
 *     sets `gl.info.autoReset = false`, so `calls` accumulates across every frame
 *     drawn since mount — reading it is non-racy (no single-frame timing window).
 *
 * Check (2) only applies to `withCanvas` stories (which expose `__r3fGl`).
 * App-owned Canvases (e.g. the Landing route) don't expose it; those fall back to
 * check (1) and are covered for "actually draws" by their `withCanvas` sibling
 * stories (LevelScene) plus their own DOM assertions.
 */
export async function sceneSmokeTest({ canvasElement }: { canvasElement: HTMLElement }) {
  const canvas = canvasElement.querySelector('canvas') as GlCanvas | null
  expect(canvas).toBeTruthy()
  expect(canvas!.width).toBeGreaterThan(0)
  expect(canvas!.height).toBeGreaterThan(0)

  // Only assert draw calls when the renderer is exposed (withCanvas stories).
  if (!canvas!.__r3fGl) return

  const deadline = 3000
  const step = 100
  let calls = 0
  for (let waited = 0; waited < deadline; waited += step) {
    calls = canvas!.__r3fGl.info.render.calls
    if (calls > 0) break
    await new Promise((r) => setTimeout(r, step))
  }
  // The scene drew at least one batch — it is not a blank/off-screen frame.
  expect(calls).toBeGreaterThan(0)
}
