import type { TimeType } from "../generic"

export type DocumentTagDto = {
  childrenIds: DocumentTagDto["id"][]
  createdAt: TimeType
  description?: string
  id: string
  name: string
  organizationId: string
  parentId?: DocumentTagDto["id"]
  projectId: string
  updatedAt: TimeType
}
