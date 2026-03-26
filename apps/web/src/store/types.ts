import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit"
import type { Services } from "@/di/services"
import type { agentMembershipsSliceReducer } from "@/features/agent-memberships/agent-memberships.slice"
import type { agentMessageFeedbackSliceReducer } from "@/features/agent-message-feedback/agent-message-feedback.slice"
import type { agentsSliceReducer } from "@/features/agents/agents.slice"
import type { conversationAgentSessionsSliceReducer } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.slice"
import type { currentAgentSessionIdSliceReducer } from "@/features/agents/current-agent-session-id/current-agent-session-id.slice"
import type { extractionAgentSessionsSliceReducer } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.slice"
import type { formAgentSessionsSliceReducer } from "@/features/agents/form-agent-sessions/form-agent-sessions.slice"
import type { agentSessionMessagesSliceReducer } from "@/features/agents/shared/agent-session-messages/agent-session-messages.slice"
import type { authSliceReducer } from "@/features/auth/auth.slice"
import type { documentTagsSliceReducer } from "@/features/document-tags/document-tags.slice"
import type { documentsSliceReducer } from "@/features/documents/documents.slice"
import type { evaluationReportsSliceReducer } from "@/features/evaluation-reports/evaluation-reports.slice"
import type { evaluationsSliceReducer } from "@/features/evaluations/evaluations.slice"
import type { meSliceReducer } from "@/features/me/me.slice"
import type { notificationsSliceReducer } from "@/features/notifications/notifications.slice"
import type { organizationsSliceReducer } from "@/features/organizations/organizations.slice"
import type { projectMembershipsSliceReducer } from "@/features/project-memberships/project-memberships.slice"
import type { projectsSliceReducer } from "@/features/projects/projects.slice"

// Define the store state structure without creating the store
// This allows us to use these types in listenerMiddleware without circular dependencies
export type RootState = {
  agentMemberships: ReturnType<typeof agentMembershipsSliceReducer>
  agentMessageFeedback: ReturnType<typeof agentMessageFeedbackSliceReducer>
  agents: ReturnType<typeof agentsSliceReducer>
  agentSessionMessages: ReturnType<typeof agentSessionMessagesSliceReducer>
  auth: ReturnType<typeof authSliceReducer>
  conversationAgentSessions: ReturnType<typeof conversationAgentSessionsSliceReducer>
  currentAgentSessionId: ReturnType<typeof currentAgentSessionIdSliceReducer>
  documents: ReturnType<typeof documentsSliceReducer>
  documentTags: ReturnType<typeof documentTagsSliceReducer>
  evaluationReports: ReturnType<typeof evaluationReportsSliceReducer>
  evaluations: ReturnType<typeof evaluationsSliceReducer>
  extractionAgentSessions: ReturnType<typeof extractionAgentSessionsSliceReducer>
  formAgentSessions: ReturnType<typeof formAgentSessionsSliceReducer>
  me: ReturnType<typeof meSliceReducer>
  notifications: ReturnType<typeof notificationsSliceReducer>
  organizations: ReturnType<typeof organizationsSliceReducer>
  projectMemberships: ReturnType<typeof projectMembershipsSliceReducer>
  projects: ReturnType<typeof projectsSliceReducer>
}

// Extra argument passed to thunks for dependency injection
export type ThunkExtraArg = {
  services: Services
}

export type AppDispatch = ThunkDispatch<RootState, ThunkExtraArg, UnknownAction>
