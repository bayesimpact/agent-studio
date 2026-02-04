import type { CreateProjectPayload, Project, UpdateProjectPayload } from "./projects.models"

export interface IProjectsSpi {
  createOne: (organizationId: string, payload: CreateProjectPayload) => Promise<Project>
  getAll: (organizationId: string) => Promise<Project[]>
  updateOne: (
    organizationId: string,
    projectId: string,
    payload: UpdateProjectPayload,
  ) => Promise<void>
  deleteOne: (organizationId: string, projectId: string) => Promise<void>
}
