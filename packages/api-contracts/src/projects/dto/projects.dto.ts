import type { TimeType } from "generic"

export type CreateProjectRequestDto = {
  name: string
  organizationId: string
}

export type CreateProjectResponseDto = {
  id: string
  name: string
  organizationId: string
}

export type ProjectDto = {
  id: string
  name: string
  organizationId: string
  createdAt: TimeType
  updatedAt: TimeType
}

export type ListProjectsResponseDto = {
  projects: ProjectDto[]
}

export type UpdateProjectRequestDto = {
  name: string
}

export type UpdateProjectResponseDto = {
  id: string
  name: string
  organizationId: string
}
