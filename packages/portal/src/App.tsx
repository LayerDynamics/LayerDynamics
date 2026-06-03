import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Portal } from './components/Portal'
import { Layout } from './components/Layout'

/** Demo scene placing DOM-window portals. In dev the Vite proxy makes the guest
 *  apps same-origin, so the windowed iframes are fully interactive in place. */
export default function App() {
  const origin = window.location.origin
  return (
    <Layout>
      <Canvas camera={{ position: [0, 0, 6] }} style={{ position: 'fixed', inset: 0 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} />
        <Portal app="demo-static" providerOrigin={origin} position={[-2.2, 0, 0]} />
        <Portal app="demo-dynamic" providerOrigin={origin} position={[2.2, 0, 0]} />
        <OrbitControls makeDefault />
      </Canvas>
    </Layout>
  )
}
