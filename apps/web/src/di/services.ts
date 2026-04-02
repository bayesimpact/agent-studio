import { services } from "@/external/axios.services"
import type { IAgentMembershipsSpi } from "@/features/agent-memberships/agent-memberships.spi"
import type { IAgentMessageFeedbackSpi } from "@/features/agent-message-feedback/agent-message-feedback.spi"
import type { IAgentsSpi } from "@/features/agents/agents.spi"
import type { IConversationAgentSessionsSpi } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.spi"
import type { IExtractionAgentSessionsSpi } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.spi"
import type { IFormAgentSessionsSpi } from "@/features/agents/form-agent-sessions/form-agent-sessions.spi"
import type { IAgentSessionMessagesSpi } from "@/features/agents/shared/agent-session-messages/agent-session-messages.spi"
import type { IAnalyticsSpi } from "@/features/analytics/analytics.spi"
import type { IDocumentTagsSpi } from "@/features/document-tags/document-tags.spi"
import type { IDocumentsSpi } from "@/features/documents/documents.spi"
import type { IEvaluationReportsSpi } from "@/features/evaluation-reports/evaluation-reports.spi"
import type { IEvaluationsSpi } from "@/features/evaluations/evaluations.spi"
import type { IInvitationsSpi } from "@/features/invitations/invitations.spi"
import type { IMeSpi } from "@/features/me/me.spi"
import type { IOrganizationsSpi } from "@/features/organizations/organizations.spi"
import type { IProjectMembershipsSpi } from "@/features/project-memberships/project-memberships.spi"
import type { IProjectsSpi } from "@/features/projects/projects.spi"

export type Services = {
  analytics: IAnalyticsSpi
  agentMemberships: IAgentMembershipsSpi
  agentMessageFeedback: IAgentMessageFeedbackSpi
  agents: IAgentsSpi
  agentSessionMessages: IAgentSessionMessagesSpi
  conversationAgentSessions: IConversationAgentSessionsSpi
  documents: IDocumentsSpi
  documentTags: IDocumentTagsSpi
  evaluationReports: IEvaluationReportsSpi
  evaluations: IEvaluationsSpi
  extractionAgentSessions: IExtractionAgentSessionsSpi
  formAgentSessions: IFormAgentSessionsSpi
  invitations: IInvitationsSpi
  me: IMeSpi
  organizations: IOrganizationsSpi
  projectMemberships: IProjectMembershipsSpi
  projects: IProjectsSpi
}

export const getServices = (): Services => {
  // TODO: if .env.STORRYBOOK => mockSerivces
  // if(envProd) require("@/external/axios") // ensure axios singleton is initialized
  // else require("@/mocks") // ensure axios singleton is initialized
  return services
}
