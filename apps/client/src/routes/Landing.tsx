import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls, Preload } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { SceneContent } from '../components/scene/SceneContent'
import LensToggle from '../components/LensToggle'
import { SCENE } from '../components/scene/lib/layout'
import { brand } from '../styles/brand'

/**
 * The scroll-driven 3D landing. The Canvas renders transparently over the CSS
 * gradient-depth body background; ScrollControls supplies scroll state that the
 * CameraRig reads to descend through the scene. `navigate` is captured here (DOM
 * side) and handed into the scene so cards can route without bridging context.
 */
export default function Landing() {
  const navigate = useNavigate()
  const onOpen = (id: string) => navigate(`/projects/${id}`)

  return (
    <div className="landing">
      <Canvas
        className="landing__canvas"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, SCENE.cameraTopY, 10], fov: 45 }}
      >
        <fog attach="fog" args={[brand.bg0, 16, 42]} />
        <Suspense fallback={null}>
          <ScrollControls
            pages={SCENE.pages}
            damping={SCENE.scrollDamping}
            maxSpeed={SCENE.scrollMaxSpeed}
          >
            <SceneContent onOpen={onOpen} />
          </ScrollControls>
          <Preload all />
        </Suspense>
      </Canvas>

      <LensToggle />
    </div>
  )
}
