import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import LevelScene from '../components/scene/LevelScene/LevelScene'
import HireMeOverlay from '../components/scene/HireMeOverlay'
import PortalOverlay from '../components/scene/PortalOverlay'
import LanguageNavBridge from '../components/LanguageNavBridge'
import LevelInput from '../components/LevelInput'
import LevelTransitions from '../components/LevelTransitions'
import LevelIndicator from '../components/LevelIndicator'
import ScrollHint from '../components/ScrollHint'
import { LEVELS } from '../stores/useLevels'

/**
 * The immersive levels landing. One transparent Canvas renders exactly one level
 * at a time (LevelScene → LevelStage); the DOM siblings drive it: LevelInput maps
 * scroll/touch/keys to in-level progress + advance/reverse, LevelTransitions plays
 * the occluding curtain between levels, and LevelIndicator shows where you are.
 * Router hooks live here (DOM side) and are handed to the scene as callbacks.
 */
export default function Landing() {
  const start = LEVELS[0].camera

  return (
    <div className="landing">
      <Canvas
        className="landing__canvas"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: start.position, fov: start.fov }}
        onCreated={({ gl }) => {
          // Required for material `clippingPlanes` — the Hero's printed name is
          // revealed by a world clip plane at the build-plate's start height.
          gl.localClippingEnabled = true
        }}
      >
        <Suspense fallback={null}>
          <LevelScene />
          <Preload all />
        </Suspense>
      </Canvas>

      <HireMeOverlay />
      <PortalOverlay />
      <LanguageNavBridge />
      <LevelInput />
      <LevelTransitions />
      <LevelIndicator />
      <ScrollHint />
    </div>
  )
}
