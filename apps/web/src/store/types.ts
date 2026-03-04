import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit"
import type { Services } from "@/di/services"
import type { agentMessageFeedbackSliceReducer } from "@/features/agent-message-feedback/agent-message-feedback.slice"
import type { agentsSliceReducer } from "@/features/agents/agents.slice"
import type { conversationAgentSessionsSliceReducer } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.slice"
import type { extractionAgentSessionsSliceReducer } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.slice"
import type { formAgentSessionsSliceReducer } from "@/features/agents/form-agent-sessions/form-agent-sessions.slice"
import type { authSliceReducer } from "@/features/auth/auth.slice"
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
  agentMessageFeedback: ReturnType<typeof agentMessageFeedbackSliceReducer>
  extractionAgentSessions: ReturnType<typeof extractionAgentSessionsSliceReducer>
  auth: ReturnType<typeof authSliceReducer>
  agents: ReturnType<typeof agentsSliceReducer>
  conversationAgentSessions: ReturnType<typeof conversationAgentSessionsSliceReducer>
  formAgentSessions: ReturnType<typeof formAgentSessionsSliceReducer>
  documents: ReturnType<typeof documentsSliceReducer>
  evaluationReports: ReturnType<typeof evaluationReportsSliceReducer>
  evaluations: ReturnType<typeof evaluationsSliceReducer>
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
