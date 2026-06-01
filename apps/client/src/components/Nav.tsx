import { Link, useLocation } from 'react-router-dom'

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
        <Link to="/hire" className="nav__link">
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
