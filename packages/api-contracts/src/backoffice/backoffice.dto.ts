import type { AgentMembershipRoleDto } from "../agent-membership/agent-membership.dto"
import type { FeatureFlagsDto } from "../feature-flags/feature-flags.dto"
import type { TimeType } from "../generic"
import type { OrganizationMembershipRoleDto } from "../organizations/organizations.dto"
import type { ProjectMembershipRoleDto } from "../project-membership/project-membership.dto"

export type BackofficeProjectDto = {
  id: string
  name: string
  organizationId: string
  createdAt: TimeType
  updatedAt: TimeType
  featureFlags: FeatureFlagsDto
  agentCategories: BackofficeProjectAgentCategoryDto[]
}

export type BackofficeProjectAgentCategoryDto = {
  id: string
  name: string
  isUsedInConversation: boolean
}

export type ReplaceBackofficeProjectAgentCategoriesDto = {
  categoryNames: string[]
}

export type BackofficeOrganizationDto = {
  id: string
  name: string
  createdAt: TimeType
  projects: BackofficeProjectDto[]
}

export type BackofficeUserOrganizationMembershipDto = {
  organizationId: string
  organizationName: string
  role: OrganizationMembershipRoleDto
}

export type BackofficeUserProjectMembershipDto = {
  projectId: string
  projectName: string
  role: ProjectMembershipRoleDto
}

export type BackofficeUserAgentMembershipDto = {
  agentId: string
  agentName: string
  role: AgentMembershipRoleDto
}

export type BackofficeUserDto = {
  id: string
  email: string
  name: string | null
  createdAt: TimeType
  organizationMemberships: BackofficeUserOrganizationMembershipDto[]
  projectMemberships: BackofficeUserProjectMembershipDto[]
  agentMemberships: BackofficeUserAgentMembershipDto[]
}
