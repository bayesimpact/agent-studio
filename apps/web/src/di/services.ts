import type { IConversationAgentSessionsSpi } from "@/common/features/agents/agent-sessions/conversation/conversation-agent-sessions.spi"
import type { IExtractionAgentSessionsSpi } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.spi"
import type { IFormAgentSessionsSpi } from "@/common/features/agents/agent-sessions/form/form-agent-sessions.spi"
import type { IAgentSessionMessagesSpi } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.spi"
import type { IAgentsSpi } from "@/common/features/agents/agents.spi"
import type { IMeSpi } from "@/common/features/me/me.spi"
import type { IOrganizationsSpi } from "@/common/features/organizations/organizations.spi"
import type { IProjectsSpi } from "@/common/features/projects/projects.spi"
import type { IDatasetsSpi } from "@/eval/features/datasets/datasets.spi"
import { services } from "@/external/axios.services"
import type { IAgentMembershipsSpi } from "@/studio/features/agent-memberships/agent-memberships.spi"
import type { IAgentMessageFeedbackSpi } from "@/studio/features/agent-message-feedback/agent-message-feedback.spi"
import type { IAnalyticsSpi } from "@/studio/features/analytics/analytics.spi"
import type { IDocumentTagsSpi } from "@/studio/features/document-tags/document-tags.spi"
import type { IDocumentsSpi } from "@/studio/features/documents/documents.spi"
import type { IEvaluationReportsSpi } from "@/studio/features/evaluation-reports/evaluation-reports.spi"
import type { IEvaluationsSpi } from "@/studio/features/evaluations/evaluations.spi"
import type { IInvitationsSpi } from "@/studio/features/invitations/invitations.spi"
import type { IProjectMembershipsSpi } from "@/studio/features/project-memberships/project-memberships.spi"

export type Services = {
  agentMemberships: IAgentMembershipsSpi
  agentMessageFeedback: IAgentMessageFeedbackSpi
  agents: IAgentsSpi
  agentSessionMessages: IAgentSessionMessagesSpi
  analytics: IAnalyticsSpi
  conversationAgentSessions: IConversationAgentSessionsSpi
  documents: IDocumentsSpi
  documentTags: IDocumentTagsSpi
  evaluationDatasets: IDatasetsSpi
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
