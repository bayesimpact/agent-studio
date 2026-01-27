export type Project = {
  id: string
  name: string
  organizationId: string
  createdAt: number
  updatedAt: number
}

export type CreateProjectPayload = {
  name: string
  organizationId: string
}

export type UpdateProjectPayload = {
  name: string
}
