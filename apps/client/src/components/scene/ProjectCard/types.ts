/** Target transform a card damps/springs toward (recomputed by the collection
 *  when the tier/domain lens changes). */
export interface CardTarget {
  position: [number, number, number]
  rotationY: number
}
