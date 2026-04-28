import type { AgentMembershipDto } from "../agent-membership/agent-membership.dto"
import type { OrganizationDto, OrganizationMembershipDto } from "../organizations/organizations.dto"
import type { ProjectMembershipDto } from "../project-membership/project-membership.dto"
import type {
  ReviewCampaignMembershipRole,
  ReviewCampaignStatus,
} from "../review-campaigns/review-campaigns.dto"

export type ReviewCampaignMembershipForMeDto = {
  id: string
  campaignId: string
  organizationId: string
  projectId: string
  role: ReviewCampaignMembershipRole
  campaignStatus: ReviewCampaignStatus
}

export type UserMembershipsDto = {
  organizationMemberships: Pick<OrganizationMembershipDto, "id" | "organizationId" | "role">[]
  projectMemberships: Pick<ProjectMembershipDto, "id" | "projectId" | "role">[]
  agentMemberships: Pick<AgentMembershipDto, "id" | "agentId" | "role">[]
  reviewCampaignMemberships: ReviewCampaignMembershipForMeDto[]
}

export type UserDto = {
  id: string
  email: string
  name: string | null
  memberships: UserMembershipsDto
  isBackofficeAuthorized: boolean
}

export type MeResponseDto = {
  user: UserDto
  organizations: OrganizationDto[]
}
