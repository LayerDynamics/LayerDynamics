import type { Tier } from '../../../data/projects'
import ProjectAccentContainer from './ProjectAccentContainer'

/** Self-contained scene content for a project detail page's mini Canvas. */
export default function ProjectAccent({ tier }: { tier: Tier }) {
  return <ProjectAccentContainer tier={tier} />
}
