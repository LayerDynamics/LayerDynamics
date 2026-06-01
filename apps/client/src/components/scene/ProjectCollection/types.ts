import type { Project } from '../../../data/projects'

export interface GroupDef {
  key: string
  label: string
  projects: Project[]
}

export interface Placed {
  labelY: number
  group: GroupDef
}
