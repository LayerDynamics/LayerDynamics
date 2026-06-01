import type { LevelId } from '../../../stores/useLevels'
import HeroLevel from './HeroLevel'
import ProcessingLevel from './ProcessingLevel'
import { PrintingLevel } from '../PrintingLevel'
import OtherWorkLevel from './OtherWorkLevel'
import HireMeLevel from './HireMeLevel'

/** Callbacks the levels may need from the DOM/router side. */
export interface LevelCallbacks {
  onOpen: (id: string) => void
  onHire: () => void
}

/**
 * Renders the active level by id. Each level is mounted in isolation (one at a
 * time) by LevelStage; this keeps the id→component mapping in one place so the
 * orchestrator stays generic.
 */
export default function LevelView({ id, cb }: { id: LevelId; cb: LevelCallbacks }) {
  switch (id) {
    case 'hero':
      return <HeroLevel />
    case 'processing':
      return <ProcessingLevel />
    case 'printing':
      return <PrintingLevel />
    case 'otherWork':
      return <OtherWorkLevel onOpen={cb.onOpen} />
    case 'hireMe':
      return <HireMeLevel onHire={cb.onHire} />
  }
}
