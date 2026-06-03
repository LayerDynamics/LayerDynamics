/** Max simultaneously-`live` portals (engaged guests running). SPEC OQ-3 default. */
export const MAX_LIVE = 1

export interface LiveRef {
  id: string
  lastEngagedAt: number
}

/** Given the currently-live portals, return the ids to demote so at most `cap`
 *  remain live — keeping the most-recently-engaged. Empty when under the cap. */
export function pickDemotions(live: LiveRef[], cap = MAX_LIVE): string[] {
  if (live.length <= cap) return []
  return [...live]
    .sort((a, b) => b.lastEngagedAt - a.lastEngagedAt)
    .slice(cap)
    .map((p) => p.id)
}
