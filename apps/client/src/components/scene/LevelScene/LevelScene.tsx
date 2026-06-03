import { useEffect } from 'react'
import { CameraRigless } from './lights'
import { LayeredBackdrop } from '../LayeredBackdrop'
import { Effects } from '../Effects'
import LevelCamera from '../LevelCamera/LevelCamera'
import LevelStage from '../LevelStage/LevelStage'
import { brand } from '../../../styles/brand'
import { useScene } from '../../../stores/useScene'

/**
 * In-Canvas composition root for the level system: background, lights, the
 * persistent layered-glass backdrop, the per-level camera, the single mounted
 * level (LevelStage), and post-processing. Replaces the old continuous
 * SceneContent (CameraRig + all sections mounted at once).
 */
export default function LevelScene() {
  const setReady = useScene((s) => s.setReady)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250)
    return () => clearTimeout(t)
  }, [setReady])

  return (
    <>
      <color attach="background" args={[brand.bg0]} />
      <fog attach="fog" args={[brand.bg0, 18, 48]} />
      <CameraRigless />
      <LayeredBackdrop />
      <LevelCamera />
      <LevelStage />
      <Effects />
    </>
  )
}
