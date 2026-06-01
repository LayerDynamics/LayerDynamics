import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'
import { Text } from '@react-three/drei'
import { projectsByTier, tiers, tierTitle } from '../../../data/projects'
import { ProjectCard, type CardTarget } from '../ProjectCard'
import { scrollProgress } from '../../../stores/levelScroll'
import { useScene } from '../../../stores/useScene'
import { brand } from '../../../styles/brand'

const FONT_MED = '/fonts/SpaceGrotesk-Medium.woff'

const CARD_W = 2.55
const CARD_H = 1.6
const PER_ROW = 4
const GAP_X = 0.6
const GAP_Y = 0.85
const GROUP_GAP = 2.2
const LABEL_GAP = 1.3
const TOP_Y = 3.6          // world-Y of the first label at progress 0
const VIEW_SPAN = 9.5      // visible vertical extent at the level camera

interface Placed {
  key: string
  label: string
  labelY: number
}

/**
 * Other Work level: the ~20 code projects as a centered, tier-grouped grid (the
 * tier↔domain lens is gone — the level structure organizes the work now).
 * Scrolling pans the grid vertically; clicking a card opens its detail route.
 */
export default function OtherWorkLevel({ onOpen }: { onOpen: (id: string) => void }) {
  const groupRef = useRef<Group>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)

  const { placed, targets, height } = useMemo(() => {
    const placed: Placed[] = []
    const targets = new Map<string, CardTarget>()
    const dx = CARD_W + GAP_X
    const dy = CARD_H + GAP_Y
    let cursor = 0 // first label at y=0; content extends downward (negative)

    tiers.forEach((t) => {
      const list = projectsByTier(t)
      const n = list.length
      if (!n) return
      const labelY = cursor
      const firstRowY = cursor - LABEL_GAP
      list.forEach((p, i) => {
        const row = Math.floor(i / PER_ROW)
        const colsInRow = Math.min(PER_ROW, n - row * PER_ROW)
        const col = i % PER_ROW
        const offset = col - (colsInRow - 1) / 2
        const x = offset * dx
        const y = firstRowY - row * dy
        const norm = colsInRow > 1 ? offset / ((colsInRow - 1) / 2) : 0
        const z = -(norm * norm) * 0.6
        targets.set(p.id, { position: [x, y, z], rotationY: -x * 0.04 })
      })
      placed.push({ key: `tier:${t}`, label: tierTitle[t], labelY })
      const rows = Math.ceil(n / PER_ROW)
      cursor = firstRowY - (rows - 1) * dy - CARD_H / 2 - GROUP_GAP - LABEL_GAP
    })

    const height = -cursor // total downward extent (positive)
    return { placed, targets, height }
  }, [])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    const p = MathUtils.clamp(scrollProgress.current, 0, 1)
    const travel = Math.max(0, height - VIEW_SPAN)
    const targetY = TOP_Y + p * travel
    g.position.y = reducedMotion ? targetY : MathUtils.damp(g.position.y, targetY, 6, delta)
  })

  return (
    <group ref={groupRef} position={[0, TOP_Y, 0]}>
      {placed.map((pl) => (
        <Text
          key={pl.key}
          font={FONT_MED}
          position={[0, pl.labelY, 0]}
          fontSize={0.32}
          color={brand.cyan}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.14}
        >
          {pl.label.toUpperCase()}
        </Text>
      ))}
      {tiers.flatMap((t) =>
        projectsByTier(t).map((p) => {
          const target = targets.get(p.id)
          if (!target) return null
          return <ProjectCard key={p.id} project={p} target={target} onOpen={onOpen} />
        }),
      )}
    </group>
  )
}
