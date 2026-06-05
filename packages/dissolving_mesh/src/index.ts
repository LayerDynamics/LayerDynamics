export { DissolvingMesh } from './components/DissolvingMesh'
export type { DissolvingMeshProps } from './components/DissolvingMesh'
export { DissolvingGLTF } from './components/DissolvingGLTF'
export type { DissolvingGLTFProps } from './components/DissolvingGLTF'
export { useDissolveController } from './components/useDissolveController'
export type { DissolveAnimation } from './components/useDissolveController'
export { ErosionMaterial } from './material/ErosionMaterial'
export type { ErosionMaterialParameters } from './material/ErosionMaterial'
export { prepareErosionGeometry } from './lib/scatter'
export type { ErosionGeometryOptions } from './lib/scatter'
export {
  injectErosion,
  ER_VERTEX_MARKER,
  ER_FRAGMENT_MARKER,
} from './material/erosion.glsl'
export type { ErosionUniforms } from './material/erosion.glsl'
