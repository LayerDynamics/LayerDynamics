import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center, Resize } from '@react-three/drei'
import { Suspense, useMemo } from 'react'
import { TorusKnotGeometry } from 'three'
import { DissolvingMesh } from '../components/DissolvingMesh'
import { DissolvingGLTF } from '../components/DissolvingGLTF'

/**
 * Standalone visual demo. Left: a primitive `TorusKnotGeometry` dissolving via
 * `DissolvingMesh`. Right: a real GLB (`LayerDynamicsLogo.glb`) dissolving via
 * `DissolvingGLTF` with its PBR material preserved. Both endlessly ping-pong.
 * Run with `pnpm --filter @layerdynamics/dissolving-mesh dev`.
 */
export default function App() {
  const geometry = useMemo(() => new TorusKnotGeometry(1, 0.32, 220, 32), [])

  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 45 }} style={{ position: 'fixed', inset: 0 }}>
      <color attach="background" args={['#07070c']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 6]} intensity={2.4} />
      <pointLight position={[-5, -3, -2]} intensity={20} color="#3355ff" />

      <DissolvingMesh
        geometry={geometry}
        position={[-3, 0, 0]}
        color="#9bb4ff"
        edgeColor="#ff5a1f"
        metalness={0.2}
        roughness={0.4}
        duration={4}
        scatter={2.2}
        spin={3}
        pingPong
      />

      <Suspense fallback={null}>
        {/* Resize normalises any asset to a unit box (CPU bounds stay intact — the flake
            displacement is GPU-only), then Center + scale frame it consistently. */}
        <Center position={[3, 0, 0]}>
          <group scale={3.5}>
            <Resize>
              <DissolvingGLTF
                url="/assets/objects/LayerDynamicsLogo.glb"
                color="#7ad7ff"
                edgeColor="#ff3ca0"
                duration={4}
                scatter={1.8}
                spin={2.5}
                pingPong
              />
            </Resize>
          </group>
        </Center>
      </Suspense>

      <OrbitControls enablePan={false} />
    </Canvas>
  )
}
