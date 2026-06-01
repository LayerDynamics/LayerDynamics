import ProjectCardContainer, { type ProjectCardContainerProps } from './ProjectCardContainer'

/** One project as a dimensional glass tile. Springs to its target, lifts on
 *  hover, dims when another is focused; click routes to the detail page. */
export default function ProjectCard(props: ProjectCardContainerProps) {
  return <ProjectCardContainer {...props} />
}
