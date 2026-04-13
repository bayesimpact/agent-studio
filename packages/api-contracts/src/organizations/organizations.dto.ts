import type { TimeType } from "../generic"
import type { ProjectDto } from "../projects/projects.dto"

export type OrganizationMembershipRoleDto = "owner" | "admin" | "member"

export type OrganizationMembershipDto = {
  id: string
  organizationId: string
  userId: string
  role: OrganizationMembershipRoleDto
}

export type OrganizationDto = {
  id: string
  name: string
  createdAt: TimeType
  projects: ProjectDto[]
}
