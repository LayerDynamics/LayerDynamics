// Public barrel for the HireMe feature. Consumers import from the folder
// (`components/HireMe`), never from the internal files.
export { default as HireMe } from './HireMe'
export type {
  HireMeValues,
  HireMeField,
  HireMeErrors,
  SubmitStatus,
  ProjectType,
} from './types'
