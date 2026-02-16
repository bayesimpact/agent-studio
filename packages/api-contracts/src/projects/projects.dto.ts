import type { TimeType } from "../generic"

export type CreateProjectRequestDto = {
  name: string
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

// --- Project Membership DTOs ---

export type ProjectMembershipDto = {
  id: string
  projectId: string
  userId: string
  userName: string | null
  userEmail: string
  status: "sent" | "accepted"
  createdAt: TimeType
}

export type ListProjectMembershipsResponseDto = {
  memberships: ProjectMembershipDto[]
}

export type InviteProjectMembersRequestDto = {
  emails: string[]
}

export type InviteProjectMembersResponseDto = {
  memberships: ProjectMembershipDto[]
}

export type RemoveProjectMembershipResponseDto = {
  success: true
}
