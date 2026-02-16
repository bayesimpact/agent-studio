import { services } from "@/external/axios.services"
import type { IAgentMessageFeedbackSpi } from "@/features/agent-message-feedback/agent-message-feedback.spi"
import type { IAgentSessionsSpi } from "@/features/agent-sessions/agent-sessions.spi"
import type { IAgentsSpi } from "@/features/agents/agents.spi"
import type { IDocumentsSpi } from "@/features/documents/documents.spi"
import type { IInvitationsSpi } from "@/features/invitations/invitations.spi"
import type { IMeSpi } from "@/features/me/me.spi"
import type { IOrganizationsSpi } from "@/features/organizations/organizations.spi"
import type { IProjectMembershipsSpi } from "@/features/project-memberships/project-memberships.spi"
import type { IProjectsSpi } from "@/features/projects/projects.spi"

export type Services = {
  agentMessageFeedback: IAgentMessageFeedbackSpi
  agents: IAgentsSpi
  agentSessions: IAgentSessionsSpi
  invitations: IInvitationsSpi
  me: IMeSpi
  organizations: IOrganizationsSpi
  projectMemberships: IProjectMembershipsSpi
  projects: IProjectsSpi
  documents: IDocumentsSpi
}

export const getServices = (): Services => {
  // TODO: if .env.STORRYBOOK => mockSerivces
  // if(envProd) require("@/external/axios") // ensure axios singleton is initialized
  // else require("@/mocks") // ensure axios singleton is initialized
  return services
}
