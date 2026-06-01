/**
 * Map a 0..1 in-level scroll progress to a clip playhead time (seconds), clamped.
 * Non-finite input resolves to 0 so a stray NaN can never advance the mixer.
 */
export function scrubToClipTime(progress: number, duration: number): number {
  if (!Number.isFinite(progress)) return 0
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress
  return p * duration
}
