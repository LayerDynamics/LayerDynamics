import { Suspense } from 'react'
import { useLevels, LEVELS } from '../../../stores/useLevels'
import { LevelView, type LevelCallbacks } from '../levels'

/**
 * In-Canvas mount point for exactly ONE level at a time. Keying the Suspense
 * boundary by level id forces a true teardown: React unmounts the outgoing
 * level (disposing its GPU resources) and mounts the incoming one. The index
 * only changes at the occluded midpoint of a transition (see LevelTransitions),
 * so the swap is never visible.
 */
export default function LevelStage({ cb }: { cb: LevelCallbacks }) {
  const index = useLevels((s) => s.index)
  const level = LEVELS[index]

  return (
    <Suspense fallback={null}>
      <LevelView key={level.id} id={level.id} cb={cb} />
    </Suspense>
  )
}
