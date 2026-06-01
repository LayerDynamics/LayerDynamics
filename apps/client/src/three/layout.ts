// Shared spatial layout for the landing scene so CameraRig and SceneContent
// agree on where each section lives along the vertical scroll axis.

export const SCENE = {
  /** ScrollControls page count (≈ how tall the scroll track is). Bumped to give
   *  the mesh-processing band its own comfortable scrub real estate. */
  pages: 8,
  heroY: 0,
  collectionY: -12,
  contactY: -22,
  /** Camera Y at scroll start (slightly above the hero, looking level). */
  cameraTopY: 1,
} as const

/**
 * The mesh-processing showcase occupies this slice of the scroll track, between
 * the hero and the project collection. While the scroll offset is inside the
 * band the section "self-holds" in front of the camera (see MeshProcessing.tsx)
 * and the 5 pipeline stages scrub from `bandStart`→`bandEnd`. The hold is
 * derived from scroll offset through the SAME lerp the CameraRig uses, so the
 * two agree by construction and CameraRig's math stays untouched.
 */
export const PROCESS = {
  bandStart: 0.14,
  bandEnd: 0.44,
} as const

/** Project cards are laid out as a tidy, centered grid per group (tier/domain)
 *  — even spacing, no overlap — instead of a wide overlapping arc. */
export const GRID = {
  cardWidth: 2.55,
  cardHeight: 1.6,
  /** Max cards per row before wrapping to a new row within the same group. */
  maxPerRow: 4,
  /** Center-to-center spacing. */
  gapX: 0.6,
  gapY: 0.75,
  /** World Y where the first group's first row sits. Pushed well below the hero
   *  to clear the mesh-processing band (PROCESS) that now sits between them; the
   *  collection's `contactY` keeps auto-deriving from here. */
  startY: -32,
  /** Vertical gap between one group's last row and the next group's label. */
  groupGap: 2.6,
  /** Space reserved above each group's rows for its label. */
  labelGap: 1.4,
  /** How far edge cards in a row curve back in Z, for a shallow forward arc. */
  arcDepth: 0.7,
} as const
