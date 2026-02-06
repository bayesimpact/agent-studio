import type { Resource } from "./resources.models"

export interface IResourcesSpi {
  getAll(params: { organizationId: string; projectId: string }): Promise<Resource[]>
  uploadOne(params: { organizationId: string; projectId: string; file: File }): Promise<Resource>
  deleteOne(params: {
    organizationId: string
    projectId: string
    resourceId: string
  }): Promise<void>
}
