import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useParams, Navigate, Link } from 'react-router-dom'
import { projectById, tierTitle } from '../data/projects'
import { tierColor } from '../styles/brand'
import ProjectAccent from '../three/ProjectAccent'
import { useInViewport } from '../hooks/useInViewport'

/**
 * Routed project detail page. DOM-first (the Hamish pattern) with a small 3D
 * accent canvas. Reveals fade in on scroll via IntersectionObserver. An unknown
 * id redirects home.
 */
export default function ProjectDetail() {
  const { id } = useParams()
  // Hooks must run before any conditional return.
  const { ref: blurbRef, visible: blurbVisible } = useInViewport<HTMLDivElement>()
  const { ref: whyRef, visible: whyVisible } = useInViewport<HTMLDivElement>()
  const { ref: actionsRef, visible: actionsVisible } =
    useInViewport<HTMLDivElement>()

  const project = id ? projectById(id) : undefined
  if (!project) return <Navigate to="/" replace />

  const tint = tierColor[project.tier]

  return (
    <main className="detail">
      <div className="detail__accent">
        <Canvas dpr={[1, 2]} gl={{ alpha: true }} camera={{ position: [0, 0, 7], fov: 42 }}>
          <Suspense fallback={null}>
            <ProjectAccent tier={project.tier} />
          </Suspense>
        </Canvas>
      </div>

      <span
        className="detail__tier"
        style={{ backgroundColor: `${tint}22`, color: tint }}
      >
        {tierTitle[project.tier]} · {project.domain}
      </span>

      <h1 className="detail__title">{project.name}</h1>

      <div className="detail__langs">
        {project.langs.map((lang) => (
          <span className="detail__lang" key={lang}>
            {lang}
          </span>
        ))}
      </div>

      <p className="detail__tagline">{project.tagline}</p>

      <div
        ref={blurbRef}
        className="reveal"
        data-visible={blurbVisible || undefined}
      >
        <p className="detail__blurb">{project.blurb}</p>
      </div>

      {project.why && (
        <div
          ref={whyRef}
          className="reveal detail__why"
          data-visible={whyVisible || undefined}
        >
          <span className="detail__why-label">Why it matters</span>
          {project.why}
        </div>
      )}

      <div
        ref={actionsRef}
        className="reveal detail__actions"
        data-visible={actionsVisible || undefined}
      >
        <a
          className="btn btn--primary"
          href={project.url}
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub →
        </a>
        <Link className="btn btn--ghost" to="/">
          ← All work
        </Link>
      </div>
    </main>
  )
}
