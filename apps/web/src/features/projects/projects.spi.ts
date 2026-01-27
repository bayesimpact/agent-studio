import type { CreateProjectPayload, Project, UpdateProjectPayload } from "./projects.models"

export interface IProjectsSpi {
  createProject: (payload: CreateProjectPayload) => Promise<Project>
  listProjects: (organizationId: string) => Promise<Project[]>
  updateProject: (projectId: string, payload: UpdateProjectPayload) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
}
