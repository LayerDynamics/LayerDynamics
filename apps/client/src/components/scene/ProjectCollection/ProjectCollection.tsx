import ProjectCollectionContainer from './ProjectCollectionContainer'

/** The whole project collection — organized strata of cards that re-arrange
 *  when the tier/domain lens changes. */
export default function ProjectCollection({ onOpen }: { onOpen: (id: string) => void }) {
  return <ProjectCollectionContainer onOpen={onOpen} />
}
