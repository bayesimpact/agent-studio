import { configureStore } from "@reduxjs/toolkit"
import { getServices } from "@/di/services"
import { agentMessageFeedbackMiddleware } from "@/features/agent-message-feedback/agent-message-feedback.middleware"
import { agentMessageFeedbackSliceReducer } from "@/features/agent-message-feedback/agent-message-feedback.slice"
import { agentSessionMiddleware } from "@/features/agent-sessions/agent-sessions.middleware"
import { agentSessionsSliceReducer } from "@/features/agent-sessions/agent-sessions.slice"
import { agentsMiddleware } from "@/features/agents/agents.middleware"
import { agentsSliceReducer } from "@/features/agents/agents.slice"
import { authMiddleware } from "@/features/auth/auth.middleware"
import { authSliceReducer } from "@/features/auth/auth.slice"
import { documentsMiddleware } from "@/features/documents/documents.middleware"
import { documentsSliceReducer } from "@/features/documents/documents.slice"
import { meSliceReducer } from "@/features/me/me.slice"
import { notificationsSliceReducer } from "@/features/notifications/notifications.slice"
import { organizationsMiddleware } from "@/features/organizations/organizations.middleware"
import { organizationsSliceReducer } from "@/features/organizations/organizations.slice"
import { projectsMiddleware } from "@/features/projects/projects.middleware"
import { projectsSliceReducer } from "@/features/projects/projects.slice"
import type { ThunkExtraArg } from "./types"

export const store = configureStore({
  reducer: {
    agentMessageFeedback: agentMessageFeedbackSliceReducer,
    auth: authSliceReducer,
    agents: agentsSliceReducer,
    agentSessions: agentSessionsSliceReducer,
    me: meSliceReducer,
    notifications: notificationsSliceReducer,
    organizations: organizationsSliceReducer,
    projects: projectsSliceReducer,
    documents: documentsSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: { services: getServices() } satisfies ThunkExtraArg,
      },
    }).prepend(
      authMiddleware.middleware,
      organizationsMiddleware.middleware,
      projectsMiddleware.middleware,
      agentsMiddleware.middleware,
      agentSessionMiddleware.middleware,
      documentsMiddleware.middleware,
      agentMessageFeedbackMiddleware.middleware,
    ),
})

// Re-export types for convenience (they're defined in types.ts to avoid circular deps)
export type { AppDispatch, RootState, ThunkExtraArg } from "./types"
