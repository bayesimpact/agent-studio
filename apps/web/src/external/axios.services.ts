import conversationAgentSessionsApi from "@/common/features/agents/agent-sessions/conversation/external/conversation-agent-sessions.api"
import extractionAgentSessionsApi from "@/common/features/agents/agent-sessions/extraction/external/extraction-agent-sessions.api"
import formAgentSessionsApi from "@/common/features/agents/agent-sessions/form/external/form-agent-sessions.api"
import agentSessionMessagesApi from "@/common/features/agents/agent-sessions/shared/agent-session-messages/external/agent-session-messages.api"
import agentsApi from "@/common/features/agents/external/agents.api"
import meApi from "@/common/features/me/external/me.api"
import organizationsApi from "@/common/features/organizations/external/organizations.api"
import projectsApi from "@/common/features/projects/external/projects.api"
import agentMembershipsApi from "@/studio/features/agent-memberships/external/agent-memberships.api"
import agentMessageFeedbackApi from "@/studio/features/agent-message-feedback/external/agent-message-feedback.api"
import agentAnalyticsApi from "@/studio/features/analytics/agent/external/agent-analytics.api"
import projectAnalyticsApi from "@/studio/features/analytics/project/external/analytics.api"
import documentTagsApi from "@/studio/features/document-tags/external/document-tags.api"
import documentsApi from "@/studio/features/documents/external/documents.api"
import evaluationReportsApi from "@/studio/features/evaluation-reports/external/evaluation-reports.api"
import evaluationsApi from "@/studio/features/evaluations/external/evaluations.api"
import invitationsApi from "@/studio/features/invitations/external/invitations.api"
import projectMembershipsApi from "@/studio/features/project-memberships/external/project-memberships.api"

export const services = {
  agentAnalytics: agentAnalyticsApi,
  agentMemberships: agentMembershipsApi,
  agentMessageFeedback: agentMessageFeedbackApi,
  agents: agentsApi,
  agentSessionMessages: agentSessionMessagesApi,
  projectAnalytics: projectAnalyticsApi,
  conversationAgentSessions: conversationAgentSessionsApi,
  documents: documentsApi,
  documentTags: documentTagsApi,
  evaluationReports: evaluationReportsApi,
  evaluations: evaluationsApi,
  extractionAgentSessions: extractionAgentSessionsApi,
  formAgentSessions: formAgentSessionsApi,
  invitations: invitationsApi,
  me: meApi,
  organizations: organizationsApi,
  projectMemberships: projectMembershipsApi,
  projects: projectsApi,
}
