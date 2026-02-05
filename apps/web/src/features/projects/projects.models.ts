import type { TimeType } from "@caseai-connect/api-contracts"

export type Project = {
  id: string
  name: string
  organizationId: string
  createdAt: TimeType
  updatedAt: TimeType
}

export type CreateProjectPayload = {
  name: string
}

export type UpdateProjectPayload = {
  name: string
}
