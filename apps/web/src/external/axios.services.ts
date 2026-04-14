import conversationAgentSessions from "@/common/features/agents/agent-sessions/conversation/external/conversation-agent-sessions.api"
import extractionAgentSessions from "@/common/features/agents/agent-sessions/extraction/external/extraction-agent-sessions.api"
import formAgentSessions from "@/common/features/agents/agent-sessions/form/external/form-agent-sessions.api"
import agentSessionMessages from "@/common/features/agents/agent-sessions/shared/agent-session-messages/external/agent-session-messages.api"
import agents from "@/common/features/agents/external/agents.api"
import me from "@/common/features/me/external/me.api"
import organizations from "@/common/features/organizations/external/organizations.api"
import projects from "@/common/features/projects/external/projects.api"
import evaluationDatasets from "@/eval/features/datasets/external/datasets.api"
import agentMemberships from "@/studio/features/agent-memberships/external/agent-memberships.api"
import agentMessageFeedback from "@/studio/features/agent-message-feedback/external/agent-message-feedback.api"
import analytics from "@/studio/features/analytics/external/analytics.api"
import documentTags from "@/studio/features/document-tags/external/document-tags.api"
import documents from "@/studio/features/documents/external/documents.api"
import evaluationReports from "@/studio/features/evaluation-reports/external/evaluation-reports.api"
import evaluations from "@/studio/features/evaluations/external/evaluations.api"
import invitations from "@/studio/features/invitations/external/invitations.api"
import projectMemberships from "@/studio/features/project-memberships/external/project-memberships.api"

export const services = {
  agentMemberships,
  agentMessageFeedback,
  agents,
  agentSessionMessages,
  analytics,
  conversationAgentSessions,
  documents,
  documentTags,
  evaluationDatasets,
  evaluationReports,
  evaluations,
  extractionAgentSessions,
  formAgentSessions,
  invitations,
  me,
  organizations,
  projectMemberships,
  projects,
}
