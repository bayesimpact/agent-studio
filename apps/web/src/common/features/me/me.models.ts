import type {
  AgentMembershipRoleDto,
  ProjectMembershipRoleDto,
  UserMembershipsDto,
} from "@caseai-connect/api-contracts"
import type { Organization } from "@/common/features/organizations/organizations.models"

export type User = {
  id: string
  email: string
  name: string
  memberships: UserMembershipsDto
  isBackofficeAuthorized: boolean
}

export type Me = {
  user: User
  organizations: Organization[]
}

export type PendingProjectInvitation = {
  id: string
  projectId: string
  projectName: string
  organizationId: string
  organizationName: string
  role: ProjectMembershipRoleDto
  invitationToken: string
  createdAt: number
}

export type PendingAgentInvitation = {
  id: string
  agentId: string
  agentName: string
  projectId: string
  projectName: string
  organizationId: string
  organizationName: string
  role: AgentMembershipRoleDto
  invitationToken: string
  createdAt: number
}

export type PendingInvitations = {
  projectInvitations: PendingProjectInvitation[]
  agentInvitations: PendingAgentInvitation[]
}
