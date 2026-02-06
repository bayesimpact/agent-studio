import { configureStore } from "@reduxjs/toolkit"
import { getServices } from "@/di/services"
import { agentSessionMiddleware } from "@/features/agent-sessions/agent-sessions.middleware"
import { agentSessionsSliceReducer } from "@/features/agent-sessions/agent-sessions.slice"
import { agentsMiddleware } from "@/features/agents/agents.middleware"
import { agentsSliceReducer } from "@/features/agents/agents.slice"
import { authMiddleware } from "@/features/auth/auth.middleware"
import { authSliceReducer } from "@/features/auth/auth.slice"
import { meSliceReducer } from "@/features/me/me.slice"
import { notificationsSliceReducer } from "@/features/notifications/notifications.slice"
import { organizationsMiddleware } from "@/features/organizations/organizations.middleware"
import { organizationsSliceReducer } from "@/features/organizations/organizations.slice"
import { projectsMiddleware } from "@/features/projects/projects.middleware"
import { projectsSliceReducer } from "@/features/projects/projects.slice"
import { resourcesMiddleware } from "@/features/resources/resources.middleware"
import { resourcesSliceReducer } from "@/features/resources/resources.slice"
import type { ThunkExtraArg } from "./types"

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    agents: agentsSliceReducer,
    agentSessions: agentSessionsSliceReducer,
    me: meSliceReducer,
    notifications: notificationsSliceReducer,
    organizations: organizationsSliceReducer,
    projects: projectsSliceReducer,
    resources: resourcesSliceReducer,
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
      resourcesMiddleware.middleware,
    ),
})

// Re-export types for convenience (they're defined in types.ts to avoid circular deps)
export type { AppDispatch, RootState, ThunkExtraArg } from "./types"
