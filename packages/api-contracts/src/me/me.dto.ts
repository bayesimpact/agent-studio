import type { AgentMembershipDto } from "../agent-membership/agent-membership.dto"
import type { OrganizationDto, OrganizationMembershipDto } from "../organizations/organizations.dto"
import type { ProjectMembershipDto } from "../project-membership/project-membership.dto"

export type UserMembershipsDto = {
  organizationMemberships: Pick<OrganizationMembershipDto, "id" | "organizationId" | "role">[]
  projectMemberships: Pick<ProjectMembershipDto, "id" | "projectId" | "role">[]
  agentMemberships: Pick<AgentMembershipDto, "id" | "agentId" | "role">[]
}

export type UserDto = {
  id: string
  email: string
  name: string | null
  memberships: UserMembershipsDto
}

export type MeResponseDto = {
  user: UserDto
  organizations: OrganizationDto[]
}
