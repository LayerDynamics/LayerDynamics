import { Link, useLocation } from 'react-router-dom'
import { useLevels, LEVEL_COUNT } from '../stores/useLevels'

/** Jump straight to the Hire-Me form, which lives on the landing's final
 *  (contact) level. The Link navigates home (no-op if already there) and this
 *  snaps the level store to that level so HireMeOverlay shows. */
const goToHire = () =>
  useLevels.setState({
    index: LEVEL_COUNT - 1,
    phase: 'live',
    direction: null,
    locked: false,
    swapped: false,
  })

export default function Nav() {
  const onDetail = useLocation().pathname.startsWith('/projects/')
  return (
    <header className="nav">
      <Link to="/" className="nav__brand" aria-label="Layer Dynamics — home">
        <img src="/layerdynamics-logo.svg" alt="" className="nav__logo" />
        <span className="nav__name">
          Layer<span className="nav__name-dim">Dynamics</span>
        </span>
      </Link>
      <nav className="nav__links">
        {onDetail && (
          <Link to="/" className="nav__link">
            ← All work
          </Link>
        )}
        <Link to="/" className="nav__link" onClick={goToHire}>
          Hire me
        </Link>
        <a
          className="nav__link"
          href="https://github.com/LayerDynamics"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </nav>
    </header>
  )
}
