import { useLevels, LEVEL_COUNT } from '../../stores/useLevels'
import { social } from '../../data/social'
import { HireMe } from '../HireMe'
import './HireMeOverlay.css'

/**
 * Brings the real Hire-Me form onto the landing itself, on the final ("hireMe")
 * level — there is no separate /hire page in the experience. The form is DOM, so
 * it mounts as a sibling to the R3F <Canvas> (not in-canvas), over the persistent
 * LayeredBackdrop. It's shown only while the contact level is active and torn
 * down with it.
 *
 * Marked [data-level-overlay] so LevelInput lets the form scroll/type instead of
 * driving level navigation — and so a scroll-up while the form is already at its
 * top still steps back a level (overscroll-to-navigate). The GitHub/email links
 * (previously the 3D contact close) live here so nothing is lost.
 */
export default function HireMeOverlay() {
  const onContactLevel = useLevels((s) => s.index === LEVEL_COUNT - 1)
  if (!onContactLevel) return null

  return (
    <div className="hire-overlay" data-level-overlay>
      <div className="hire-overlay__inner">
        <HireMe />
        <ul className="hire-overlay__social">
          {social.map((link) => (
            <li key={link.id}>
              <a
                className="hire-overlay__link"
                href={link.href}
                target={link.id === 'email' ? '_self' : '_blank'}
                rel="noopener noreferrer"
              >
                {link.label} — {link.value}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
