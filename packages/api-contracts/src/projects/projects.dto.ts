// Project entity DTO
export type ProjectDto = {
  id: string
  name: string
  organizationId: string
  createdAt: number // TimeType (milliseconds since epoch)
  updatedAt: number // TimeType (milliseconds since epoch)
}

// Create project DTOs
export type CreateProjectRequestDto = {
  name: string
  organizationId: string
}

export type CreateProjectResponseDto = {
  id: string
  name: string
  organizationId: string
}

// List projects DTOs
export type ListProjectsResponseDto = {
  projects: ProjectDto[]
}

// Update project DTOs
export type UpdateProjectRequestDto = {
  name: string
}

export type UpdateProjectResponseDto = {
  id: string
  name: string
  organizationId: string
}
