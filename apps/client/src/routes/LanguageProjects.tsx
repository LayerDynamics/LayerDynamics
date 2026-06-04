import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useParams, Navigate, Link } from 'react-router-dom'
import { languageById, reposForLanguage } from '../data/languages'
import { langColor } from '../styles/brand'
import LanguageLogo from '../components/scene/Languages/LanguageLogo'
import RepoCard from '../components/RepoCard'
import { useInViewport } from '../hooks/useInViewport'

/**
 * Routed per-language page (/languages/:lang). DOM-first (the ProjectDetail
 * pattern) with a small 3D accent rendering the language's brand-colored logo GLB,
 * then a responsive grid of curated GitHub repo cards (data/languages.ts). An
 * unknown :lang redirects home. Cards link straight to the repos on GitHub.
 */
export default function LanguageProjects() {
  const { lang } = useParams()
  // Hooks must run before any conditional return.
  const { ref: gridRef, visible } = useInViewport<HTMLDivElement>()

  const def = lang ? languageById(lang) : undefined
  if (!def) return <Navigate to="/" replace />

  const repos = reposForLanguage(def.id)
  const tint = langColor[def.id].base

  return (
    <main className="lang">
      <div className="lang__accent" aria-hidden>
        <Canvas dpr={[1, 2]} gl={{ alpha: true }} camera={{ position: [0, 0, 4], fov: 42 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 3, 5]} intensity={1.3} />
            <LanguageLogo lang={def} position={[0, 0, 0]} size={2.4} />
          </Suspense>
        </Canvas>
      </div>

      <span
        className="lang__badge"
        style={{ backgroundColor: `${tint}22`, color: tint }}
      >
        Languages · {def.label}
      </span>

      <h1 className="lang__title">{def.label}</h1>
      <p className="lang__blurb">{def.blurb}</p>

      <div ref={gridRef} className="reveal" data-visible={visible || undefined}>
        {repos.length > 0 ? (
          <div className="repo-grid">
            {repos.map((repo) => (
              <RepoCard key={repo.name} repo={repo} />
            ))}
          </div>
        ) : (
          <p className="lang__empty">More {def.label} work coming soon.</p>
        )}
      </div>

      <div className="lang__actions">
        <Link className="btn btn--ghost" to="/">
          ← Back
        </Link>
      </div>
    </main>
  )
}
