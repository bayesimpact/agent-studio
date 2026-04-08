import { configureStore, type Reducer } from "@reduxjs/toolkit"
import { extractionAgentSessionsMiddleware } from "@/common/features/agents/agent-sessions/extraction/extraction-agent-sessions.middleware"
import { agentSessionMessagesMiddleware } from "@/common/features/agents/agent-sessions/shared/agent-session-messages/agent-session-messages.middleware"
import { baseAgentSessionsMiddleware } from "@/common/features/agents/agent-sessions/shared/base-agent-session/base-agent-sessions.middleware"
import { agentsMiddleware } from "@/common/features/agents/agents.middleware"
import { authMiddleware } from "@/common/features/auth/auth.middleware"
import { meMiddleware } from "@/common/features/me/me.middleware"
import { organizationsMiddleware } from "@/common/features/organizations/organizations.middleware"
import { projectsMiddleware } from "@/common/features/projects/projects.middleware"
import { getServices } from "@/di/services"
import { dynamicMiddleware } from "./dynamic-middleware"
import { rootSlices } from "./root-slices"
import type { RootState, ThunkExtraArg } from "./types"

// The rootSlices uses combineSlices with lazy-loaded studio slices (optional in its type).
// We cast to Reducer<RootState> because RootState keeps all slices as required —
// studio selectors are only called from studio routes where injectStudioSlices() has run.
export const buildStore = () =>
  configureStore({
    reducer: rootSlices as unknown as Reducer<RootState>,
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
export const store = buildStore()

// Re-export types for convenience (they're defined in types.ts to avoid circular deps)
export type { AppDispatch, RootState, ThunkExtraArg } from "./types"
