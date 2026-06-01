import { useEffect } from 'react'
import CameraRig from './CameraRig'
import LayeredBackdrop from './LayeredBackdrop'
import Hero from './Hero'
import MeshProcessing from './MeshProcessing'
import ProjectCollection from './ProjectCollection'
import Contact from './Contact'
import Effects from './Effects'
import { brand } from '../styles/brand'
import { useScene } from '../stores/useScene'

/**
 * Everything inside the Canvas/ScrollControls: lights, the camera rig, the
 * persistent depth field, and the three sections placed in world space (the
 * camera moves through them — the content itself does not scroll).
 */
export default function SceneContent({ onOpen }: { onOpen: (id: string) => void }) {
  const setReady = useScene((s) => s.setReady)

  useEffect(() => {
    // The scene has mounted; clear the loader (Loader also has a hard fallback).
    const t = setTimeout(() => setReady(true), 250)
    return () => clearTimeout(t)
  }, [setReady])

  return (
    <>
      <color attach="background" args={[brand.bg0]} />

      {/* Hero lighting: low ambient + a key from front-top and two brand rim
          lights, so the glass slabs catch crisp specular highlights (which then
          bloom) instead of reading as flat ghosts. */}
      <ambientLight intensity={0.35} />
      <spotLight
        position={[3, 8, 9]}
        angle={0.5}
        penumbra={0.8}
        intensity={120}
        distance={40}
        color={brand.lavender}
      />
      <pointLight position={[-6, 2, 4]} intensity={45} distance={28} color={brand.cyan} />
      <pointLight position={[6, -1, 5]} intensity={42} distance={28} color={brand.violetSoft} />
      <pointLight position={[0, -12, 7]} intensity={30} distance={40} color={brand.violet} />

      <CameraRig />
      <LayeredBackdrop />
      <Hero />
      <MeshProcessing />
      <ProjectCollection onOpen={onOpen} />
      <Contact />

      <Effects />
    </>
  )
}
