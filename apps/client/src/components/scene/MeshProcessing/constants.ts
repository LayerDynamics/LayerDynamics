/** The real product geometry: the LayerDynamics logo (a 17-body CAD solid). */
export const LOGO_URL = '/assets/objects/LayerDynamicsLogo.glb'

/** Client-facing caption per pipeline stage, in scroll order. The copy is
 *  deliberately honest about what each stage actually computes (the segmentation
 *  is feature-space k-means over position+normal; the decimation is vertex
 *  clustering) — no dressed-up ML claims. */
export const STAGES = [
  { kicker: '01 / 05', title: 'SOLID → SURFACE MESH' },
  { kicker: '02 / 05', title: 'POINT-CLOUD SAMPLING' },
  { kicker: '03 / 05', title: 'NORMAL & SPATIAL SEGMENTATION' },
  { kicker: '04 / 05', title: 'VERTEX-CLUSTER DECIMATION' },
  { kicker: '05 / 05', title: 'VARIATION & GENERATION' },
] as const
