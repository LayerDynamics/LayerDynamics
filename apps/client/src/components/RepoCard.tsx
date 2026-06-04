import type { LangRepo } from '../data/languages'

/**
 * Presentational card for one curated GitHub repo on a language page. The whole
 * card is a single external link to the repo (these are live repos, most without an
 * internal editorial detail page), so it opens GitHub in a new tab.
 */
export default function RepoCard({ repo }: { repo: LangRepo }) {
  return (
    <a
      className="repo-card"
      href={repo.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${repo.name} on GitHub`}
    >
      <div className="repo-card__head">
        <span className="repo-card__name">{repo.name}</span>
        {repo.stars > 0 && (
          <span className="repo-card__stars" aria-hidden>
            ★ {repo.stars}
          </span>
        )}
      </div>
      <p className="repo-card__desc">{repo.description}</p>
      <div className="repo-card__foot">
        <span className="detail__lang">{repo.primaryLang}</span>
        <span className="repo-card__ext" aria-hidden>
          GitHub ↗
        </span>
      </div>
    </a>
  )
}
