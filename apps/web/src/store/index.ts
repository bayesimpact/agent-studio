import { configureStore } from "@reduxjs/toolkit"
import { getServices } from "@/di/services"
import { agentMessageFeedbackMiddleware } from "@/features/agent-message-feedback/agent-message-feedback.middleware"
import { agentMessageFeedbackSliceReducer } from "@/features/agent-message-feedback/agent-message-feedback.slice"
import { agentsMiddleware } from "@/features/agents/agents.middleware"
import { agentsSliceReducer } from "@/features/agents/agents.slice"
import { conversationAgentSessionsMiddleware } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.middleware"
import { conversationAgentSessionsSliceReducer } from "@/features/agents/conversation-agent-sessions/conversation-agent-sessions.slice"
import { currentAgentSessionIdSliceReducer } from "@/features/agents/current-agent-session-id/current-agent-session-id.slice"
import { extractionAgentSessionsMiddleware } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.middleware"
import { extractionAgentSessionsSliceReducer } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.slice"
import { formAgentSessionsMiddleware } from "@/features/agents/form-agent-sessions/form-agent-sessions.middleware"
import { formAgentSessionsSliceReducer } from "@/features/agents/form-agent-sessions/form-agent-sessions.slice"
import { agentSessionMessagesMiddleware } from "@/features/agents/shared/agent-session-messages/agent-session-messages.middleware"
import { agentSessionMessagesSliceReducer } from "@/features/agents/shared/agent-session-messages/agent-session-messages.slice"
import { authMiddleware } from "@/features/auth/auth.middleware"
import { authSliceReducer } from "@/features/auth/auth.slice"
import { documentsMiddleware } from "@/features/documents/documents.middleware"
import { documentsSliceReducer } from "@/features/documents/documents.slice"
import { evaluationReportsMiddleware } from "@/features/evaluation-reports/evaluation-reports.middleware"
import { evaluationReportsSliceReducer } from "@/features/evaluation-reports/evaluation-reports.slice"
import { evaluationsMiddleware } from "@/features/evaluations/evaluations.middleware"
import { evaluationsSliceReducer } from "@/features/evaluations/evaluations.slice"
import { meMiddleware } from "@/features/me/me.middleware"
import { meSliceReducer } from "@/features/me/me.slice"
import { notificationsSliceReducer } from "@/features/notifications/notifications.slice"
import { organizationsMiddleware } from "@/features/organizations/organizations.middleware"
import { organizationsSliceReducer } from "@/features/organizations/organizations.slice"
import { projectMembershipsMiddleware } from "@/features/project-memberships/project-memberships.middleware"
import { projectMembershipsSliceReducer } from "@/features/project-memberships/project-memberships.slice"
import { projectsMiddleware } from "@/features/projects/projects.middleware"
import { projectsSliceReducer } from "@/features/projects/projects.slice"
import type { ThunkExtraArg } from "./types"

export const store = configureStore({
  reducer: {
    agentMessageFeedback: agentMessageFeedbackSliceReducer,
    agents: agentsSliceReducer,
    agentSessionMessages: agentSessionMessagesSliceReducer,
    auth: authSliceReducer,
    conversationAgentSessions: conversationAgentSessionsSliceReducer,
    currentAgentSessionId: currentAgentSessionIdSliceReducer,
    documents: documentsSliceReducer,
    evaluationReports: evaluationReportsSliceReducer,
    evaluations: evaluationsSliceReducer,
    extractionAgentSessions: extractionAgentSessionsSliceReducer,
    formAgentSessions: formAgentSessionsSliceReducer,
    me: meSliceReducer,
    notifications: notificationsSliceReducer,
    organizations: organizationsSliceReducer,
    projectMemberships: projectMembershipsSliceReducer,
    projects: projectsSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: { services: getServices() } satisfies ThunkExtraArg,
      },
    }).prepend(
      agentMessageFeedbackMiddleware.middleware,
      agentSessionMessagesMiddleware.middleware,
      agentsMiddleware.middleware,
      authMiddleware.middleware,
      conversationAgentSessionsMiddleware.middleware,
      documentsMiddleware.middleware,
      evaluationReportsMiddleware.middleware,
      evaluationsMiddleware.middleware,
      extractionAgentSessionsMiddleware.middleware,
      formAgentSessionsMiddleware.middleware,
      meMiddleware.middleware,
      organizationsMiddleware.middleware,
      projectMembershipsMiddleware.middleware,
      projectsMiddleware.middleware,
    ),
})

// Re-export types for convenience (they're defined in types.ts to avoid circular deps)
export type { AppDispatch, RootState, ThunkExtraArg } from "./types"
