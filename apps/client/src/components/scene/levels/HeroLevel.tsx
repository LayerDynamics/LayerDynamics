import { useRef } from 'react'
import Printer, { type BedState } from '../Printer/Printer'
import PrintedTitle from '../Printer/PrintedTitle'

/**
 * Hero level: the Ender 5 printer "printing" the owner's name. The printer rig +
 * bed/head motion are scroll-driven (Printer); the name (PrintedTitle) sits on the
 * build plate and is revealed bottom-up by a plate-linked clip plane as the bed
 * descends. Pure printer — no overlay text/monolith. The bed state is shared from
 * Printer → PrintedTitle via a ref so the name stays locked to the plate.
 */
export default function HeroLevel() {
  const bed = useRef<BedState | null>(null)
  return (
    <Printer onBed={(b) => (bed.current = b)}>
      <PrintedTitle bed={bed} />
    </Printer>
  )
}
