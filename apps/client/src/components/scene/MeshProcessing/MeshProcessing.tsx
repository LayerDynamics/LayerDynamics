import MeshProcessingContainer from './MeshProcessingContainer'

/**
 * The mesh-processing showcase: scrolling its band scrubs the logo through the
 * pipeline — Solid → Surface mesh → Point-cloud sampling → Normal/spatial
 * segmentation → Vertex-cluster decimation → Variation & generation — while the
 * section self-holds in front of the camera, then releases.
 */
export default function MeshProcessing() {
  return <MeshProcessingContainer />
}
