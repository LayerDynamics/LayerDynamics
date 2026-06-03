import type { LevelId } from '../../../stores/useLevels'
import HeroLevel from './HeroLevel'
import OtherWorkLevel from './OtherWorkLevel'
import HireMeLevel from './HireMeLevel'

/**
 * Renders the active level by id. Each level is mounted in isolation (one at a
 * time) by LevelStage; this keeps the id→component mapping in one place so the
 * orchestrator stays generic.
 */
export default function LevelView({ id }: { id: LevelId }) {
  switch (id) {
    case 'hero':
      return <HeroLevel />
    case 'otherWork':
      return <OtherWorkLevel />
    case 'hireMe':
      return <HireMeLevel />
  }
}
