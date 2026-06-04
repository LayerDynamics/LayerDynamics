import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import LanguageLogo from './LanguageLogo'
import { useLanguageNav } from '../../../stores/useLanguageNav'
import {
  languageById,
  languageOrder,
  languages,
  type LanguageDef,
  type LanguageId,
} from '../../../data/languages'

/** Constant world width the column centers span on every aspect (see useLevels:
 *  the `languages` camera box is wider than any screen, so framing is width-driven —
 *  keeping this constant makes the logos fill the same fraction of width whether the
 *  row is 5-wide on desktop or reflowed to a 3-column grid on a phone). */
const GRID_W = 9

const ORDERED: LanguageDef[] = languageOrder
  .map(languageById)
  .filter((d): d is LanguageDef => Boolean(d))

/**
 * Languages level: the five brand-colored extruded tech-logo GLBs, arranged in a
 * responsive grid. Wide aspects show a single 5-wide row; portrait/square aspects
 * reflow to 3 columns (2 rows) so each logo scales UP instead of crushing — the
 * column span stays GRID_W on both, so the camera framing holds. Clicking a logo
 * sets the pending language in `useLanguageNav`; the DOM `LanguageNavBridge` (a
 * Canvas sibling) performs the actual route navigation. `onSelect` can be overridden
 * (e.g. in stories) but defaults to the store so no router context leaks into the Canvas.
 */
export default function LanguagesLevel({
  onSelect,
}: {
  onSelect?: (id: LanguageId) => void
}) {
  const open = useLanguageNav((s) => s.open)
  const select = onSelect ?? open
  const { width, height } = useThree((s) => s.size)
  const cols = width / height >= 1.1 ? 5 : 3
  const rows = Math.ceil(ORDERED.length / cols)
  const cell = GRID_W / cols
  const size = cell * 0.6
  const pitchY = cell * 0.95

  return (
    <group>
      {ORDERED.map((lang, i) => {
        const r = Math.floor(i / cols)
        const itemsInRow = Math.min(cols, ORDERED.length - r * cols)
        const c = i - r * cols
        const x = (c - (itemsInRow - 1) / 2) * cell
        const y = ((rows - 1) / 2 - r) * pitchY
        return (
          <LanguageLogo
            key={lang.id}
            lang={lang}
            position={[x, y, 0]}
            size={size}
            onSelect={select}
          />
        )
      })}
    </group>
  )
}

// Warm the GPU/HTTP cache for every logo so entering the level doesn't pop.
languages.forEach((l) => useGLTF.preload(l.glb))
