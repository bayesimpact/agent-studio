export type ProjectDto = {
  id: string
  name: string
  organizationId: string
  createdAt: number // TimeType (milliseconds since epoch)
  updatedAt: number // TimeType (milliseconds since epoch)
}

export type ListProjectsResponseDto = {
  projects: ProjectDto[]
}
