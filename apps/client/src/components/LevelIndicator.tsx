import { useLevels, LEVELS, LEVEL_COUNT } from '../stores/useLevels'

const LABELS: Record<string, string> = {
  hero: 'Layer Dynamics',
  processing: '3D Processing',
  otherWork: 'Other Work',
  hireMe: 'Hire Me',
}

/**
 * Minimal level progress indicator: the active level's name, a NN / NN counter,
 * and a dotted rail. Reads the live level index so it always agrees with the
 * scene (single source of truth: useLevels).
 */
export default function LevelIndicator() {
  const rawIndex = useLevels((s) => s.index)
  // Clamp into range so a stray out-of-bounds index never crashes the indicator.
  const index = Math.min(Math.max(rawIndex, 0), LEVEL_COUNT - 1)
  const id = LEVELS[index].id

  return (
    <div className="level-indicator" aria-live="polite">
      <span className="level-indicator__name">{LABELS[id]}</span>
      <span className="level-indicator__count mono">
        {String(index + 1).padStart(2, '0')} / {String(LEVEL_COUNT).padStart(2, '0')}
      </span>
      <span className="level-indicator__rail" aria-hidden>
        {LEVELS.map((l, i) => (
          <span key={l.id} className="level-indicator__dot" data-on={i === index || undefined} />
        ))}
      </span>
    </div>
  )
}
