import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useScene } from '../stores/useScene'

/**
 * Brand loading overlay. Reflects drei's global asset progress, but the landing
 * scene is largely procedural (font + logo SVG load outside the loading
 * manager), so a fallback timer guarantees the overlay always clears.
 */
export default function Loader() {
  const { active, progress } = useProgress()
  const ready = useScene((s) => s.ready)
  const setReady = useScene((s) => s.setReady)

  useEffect(() => {
    if (!active && progress >= 100) setReady(true)
  }, [active, progress, setReady])

  useEffect(() => {
    const fallback = setTimeout(() => setReady(true), 2200)
    return () => clearTimeout(fallback)
  }, [setReady])

  return (
    <div className="loader" data-hidden={ready || undefined} aria-hidden={ready}>
      <img className="loader__mark" src="/layerdynamics-logo.svg" alt="" />
      <div className="loader__bar">
        <span style={{ width: `${ready ? 100 : progress}%` }} />
      </div>
      <span className="loader__pct mono">
        {ready ? 100 : Math.round(progress)}%
      </span>
    </div>
  )
}
