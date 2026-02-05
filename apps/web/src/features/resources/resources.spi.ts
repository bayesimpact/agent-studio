import type { Resource } from "./resources.models"

export interface IResourcesSpi {
  uploadOne(params: { organizationId: string; projectId: string; file: File }): Promise<Resource>
}
