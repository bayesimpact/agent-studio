import type { CreateProjectPayload, Project, UpdateProjectPayload } from "./projects.models"

export interface IProjectsSpi {
  createOne: (payload: CreateProjectPayload) => Promise<Project>
  getAll: (organizationId: string) => Promise<Project[]>
  updateOne: (projectId: string, payload: UpdateProjectPayload) => Promise<void>
  deleteOne: (projectId: string) => Promise<void>
}
