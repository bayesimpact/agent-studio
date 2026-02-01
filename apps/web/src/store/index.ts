import { configureStore } from "@reduxjs/toolkit"
import { getServices } from "@/di/services"
import { authSliceReducer } from "@/features/auth/auth.slice"
import { chatBotsMiddleware } from "@/features/chat-bots/chat-bots.middleware"
import { chatBotsSliceReducer } from "@/features/chat-bots/chat-bots.slice"
import { chatSessionMiddleware } from "@/features/chat-sessions/chat-sessions.middleware"
import { chatSessionsSliceReducer } from "@/features/chat-sessions/chat-sessions.slice"
import { meSliceReducer } from "@/features/me/me.slice"
import { notificationsSliceReducer } from "@/features/notifications/notifications.slice"
import { organizationsMiddleware } from "@/features/organizations/organizations.middleware"
import { organizationsSliceReducer } from "@/features/organizations/organizations.slice"
import { projectsMiddleware } from "@/features/projects/projects.middleware"
import { projectsSliceReducer } from "@/features/projects/projects.slice"
import { listenerMiddleware } from "./listenerMiddleware"
import type { ThunkExtraArg } from "./types"

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    chatBots: chatBotsSliceReducer,
    chatSessions: chatSessionsSliceReducer,
    me: meSliceReducer,
    notifications: notificationsSliceReducer,
    organizations: organizationsSliceReducer,
    projects: projectsSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: { services: getServices() } satisfies ThunkExtraArg,
      },
    }).prepend(
      listenerMiddleware.middleware,
      organizationsMiddleware.middleware,
      projectsMiddleware.middleware,
      chatBotsMiddleware.middleware,
      chatSessionMiddleware.middleware,
    ),
})

// Re-export types for convenience (they're defined in types.ts to avoid circular deps)
export type { AppDispatch, RootState, ThunkExtraArg } from "./types"
