import type { TimeType } from "../generic"

export type DocumentTagDto = {
  createdAt: TimeType
  description: string | null
  id: string
  name: string
  organizationId: string
  parentId: string | null
  projectId: string
  updatedAt: TimeType
}

