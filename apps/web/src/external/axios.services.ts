import agentMessageFeedbackApi from "@/features/agent-message-feedback/external/agent-message-feedback.api"
import agentSessionsApi from "@/features/agent-sessions/external/agent-sessions.api"
import agentsApi from "@/features/agents/external/agents.api"
import documentsApi from "@/features/documents/external/documents.api"
import meApi from "@/features/me/external/me.api"
import organizationsApi from "@/features/organizations/external/organizations.api"
import projectMembershipsApi from "@/features/project-memberships/external/project-memberships.api"
import projectsApi from "@/features/projects/external/projects.api"

export const services = {
  agentMessageFeedback: agentMessageFeedbackApi,
  agents: agentsApi,
  agentSessions: agentSessionsApi,
  me: meApi,
  organizations: organizationsApi,
  projectMemberships: projectMembershipsApi,
  projects: projectsApi,
  documents: documentsApi,
}
