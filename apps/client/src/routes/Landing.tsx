import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import LevelScene from '../components/scene/LevelScene/LevelScene'
import LevelInput from '../components/LevelInput'
import LevelTransitions from '../components/LevelTransitions'
import LevelIndicator from '../components/LevelIndicator'
import type { LevelCallbacks } from '../components/scene/levels'
import { LEVELS } from '../stores/useLevels'

/**
 * The immersive levels landing. One transparent Canvas renders exactly one level
 * at a time (LevelScene → LevelStage); the DOM siblings drive it: LevelInput maps
 * scroll/touch/keys to in-level progress + advance/reverse, LevelTransitions plays
 * the occluding curtain between levels, and LevelIndicator shows where you are.
 * Router hooks live here (DOM side) and are handed to the scene as callbacks.
 */
export default function Landing() {
  const navigate = useNavigate()
  const cb: LevelCallbacks = {
    onOpen: (id) => navigate(`/projects/${id}`),
    onHire: () => navigate('/hire'),
  }

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
          <LevelScene cb={cb} />
          <Preload all />
        </Suspense>
      </Canvas>

      <LevelInput />
      <LevelTransitions />
      <LevelIndicator />
    </div>
  )
}
