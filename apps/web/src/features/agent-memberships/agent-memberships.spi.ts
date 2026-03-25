import type { AgentMembership } from "./agent-memberships.models"

export interface IAgentMembershipsSpi {
  getAll: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<AgentMembership[]>
  invite: (params: {
    organizationId: string
    projectId: string
    agentId: string
    emails: string[]
  }) => Promise<AgentMembership[]>
  remove: (params: {
    organizationId: string
    projectId: string
    agentId: string
    membershipId: string
  }) => Promise<void>
}
