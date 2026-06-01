import HireMeContainer from './HireMeContainer'
import './HireMe.css'

/**
 * Public entry point for the HireMe feature — the only module the rest of the
 * app imports. It composes the feature (here, just the container) and pulls in
 * the feature's styles, keeping the internal Container/Layout/Form split private
 * to the folder. This is the canonical shape every feature follows:
 *
 *   <Feature>/
 *     <Feature>.tsx           entry — composes + owns the public surface
 *     <Feature>Container.tsx  smart — state, effects, handlers
 *     <Feature>Layout.tsx     presentational shell
 *     <Feature>Form.tsx …     feature sub-pieces
 *     types.ts · <Feature>.css · index.ts
 */
export default function HireMe() {
  return <HireMeContainer />
}
