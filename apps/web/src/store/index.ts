import { configureStore, type Reducer } from "@reduxjs/toolkit"
import { getServices } from "@/di/services"
import { agentsMiddleware } from "@/features/agents/agents.middleware"
import { extractionAgentSessionsMiddleware } from "@/features/agents/extraction-agent-sessions/extraction-agent-sessions.middleware"
import { agentSessionMessagesMiddleware } from "@/features/agents/shared/agent-session-messages/agent-session-messages.middleware"
import { baseAgentSessionsMiddleware } from "@/features/agents/shared/base-agent-session/base-agent-sessions.middleware"
import { authMiddleware } from "@/features/auth/auth.middleware"
import { meMiddleware } from "@/features/me/me.middleware"
import { organizationsMiddleware } from "@/features/organizations/organizations.middleware"
import { projectsMiddleware } from "@/features/projects/projects.middleware"
import { dynamicMiddleware } from "./dynamic-middleware"
import { rootReducer } from "./root-reducer"
import type { RootState, ThunkExtraArg } from "./types"

// The rootReducer uses combineSlices with lazy-loaded studio slices (optional in its type).
// We cast to Reducer<RootState> because RootState keeps all slices as required —
// studio selectors are only called from studio routes where injectStudioSlices() has run.
export const store = configureStore({
  reducer: rootReducer as unknown as Reducer<RootState>,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: { services: getServices() } satisfies ThunkExtraArg,
      },
    }).prepend(
      dynamicMiddleware.middleware,
      agentSessionMessagesMiddleware.middleware,
      agentsMiddleware.middleware,
      authMiddleware.middleware,
      extractionAgentSessionsMiddleware.middleware,
      baseAgentSessionsMiddleware.middleware,
      meMiddleware.middleware,
      organizationsMiddleware.middleware,
      projectsMiddleware.middleware,
    ),
})

// Re-export types for convenience (they're defined in types.ts to avoid circular deps)
export type { AppDispatch, RootState, ThunkExtraArg } from "./types"
