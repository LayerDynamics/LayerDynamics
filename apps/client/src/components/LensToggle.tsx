import { useScene } from '../stores/useScene'

/** DOM segmented control overlaid on the landing canvas: organize the project
 *  collection By tier or By domain. Lives outside the Canvas; drives the store.
 *  Only shown (and focusable) while the camera is in the collection section. */
export default function LensToggle() {
  const lens = useScene((s) => s.lens)
  const setLens = useScene((s) => s.setLens)
  const inCollection = useScene((s) => s.section === 'collection')

  return (
    <div
      className="lens"
      role="group"
      aria-label="Organize projects by"
      data-visible={inCollection || undefined}
      aria-hidden={!inCollection}
    >
      <button
        type="button"
        className="lens__btn"
        data-active={lens === 'tier' || undefined}
        aria-pressed={lens === 'tier'}
        tabIndex={inCollection ? 0 : -1}
        onClick={() => setLens('tier')}
      >
        By tier
      </button>
      <button
        type="button"
        className="lens__btn"
        data-active={lens === 'domain' || undefined}
        aria-pressed={lens === 'domain'}
        tabIndex={inCollection ? 0 : -1}
        onClick={() => setLens('domain')}
      >
        By domain
      </button>
    </div>
  )
}
