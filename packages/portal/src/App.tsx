import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Portal } from './components/Portal'
import { PortalDebugOverlay } from './components/PortalDebugOverlay'
import { Layout } from './components/Layout'

/** Demo scene placing DOM-window portals. In dev the Vite proxy makes the guest
 *  apps same-origin, so the windowed iframes are fully interactive in place.
 *
 *  `?e2e` renders a single centered portal with no OrbitControls — a deterministic
 *  target for the full-stack Playwright E2E (clicking canvas center engages it). */
export default function App() {
  const origin = window.location.origin
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const e2e = params?.has('e2e') ?? false
  // ?e2e&app=<id> targets a specific registered app (defaults to demo-static).
  const e2eApp = params?.get('app') ?? 'demo-static'

  if (e2e) {
    return (
      <Layout>
        <Canvas camera={{ position: [0, 0, 6] }} style={{ position: 'fixed', inset: 0 }}>
          <ambientLight intensity={0.9} />
          <Portal app={e2eApp} providerOrigin={origin} position={[0, 0, 0]} size={[4, 3]} />
        </Canvas>
        <PortalDebugOverlay debug />
      </Layout>
    )
  }

  return (
    <Layout>
      <Canvas camera={{ position: [0, 0, 6] }} style={{ position: 'fixed', inset: 0 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} />
        <Portal app="demo-static" providerOrigin={origin} position={[-2.2, 0, 0]} />
        <Portal app="demo-dynamic" providerOrigin={origin} position={[2.2, 0, 0]} />
        <OrbitControls makeDefault />
      </Canvas>
      <PortalDebugOverlay debug />
    </Layout>
  )
}
