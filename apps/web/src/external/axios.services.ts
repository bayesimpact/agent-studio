import agentMessageFeedbackApi from "@/features/agent-message-feedback/external/agent-message-feedback.api"
import agentSessionsApi from "@/features/agent-sessions/external/agent-sessions.api"
import agentsApi from "@/features/agents/external/agents.api"
import extractionAgentSessionsApi from "@/features/agents/extraction-agent-sessions/external/extraction-agent-sessions.api"
import documentsApi from "@/features/documents/external/documents.api"
import evaluationReportsApi from "@/features/evaluation-reports/external/evaluation-reports.api"
import evaluationsApi from "@/features/evaluations/external/evaluations.api"
import invitationsApi from "@/features/invitations/external/invitations.api"
import meApi from "@/features/me/external/me.api"
import organizationsApi from "@/features/organizations/external/organizations.api"
import projectMembershipsApi from "@/features/project-memberships/external/project-memberships.api"
import projectsApi from "@/features/projects/external/projects.api"

export const services = {
  agentMessageFeedback: agentMessageFeedbackApi,
  extractionAgentSessions: extractionAgentSessionsApi,
  agents: agentsApi,
  agentSessions: agentSessionsApi,
  documents: documentsApi,
  evaluationReports: evaluationReportsApi,
  evaluations: evaluationsApi,
  invitations: invitationsApi,
  me: meApi,
  organizations: organizationsApi,
  projectMemberships: projectMembershipsApi,
  projects: projectsApi,
}
