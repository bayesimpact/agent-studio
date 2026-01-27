import { configureStore } from "@reduxjs/toolkit"
import { getServices } from "@/di/services"
import { authSlice } from "@/features/auth/auth.slice"
import { chatBotsSlice } from "@/features/chat-bots/chat-bots.slice"
import { meSlice } from "@/features/me/me.slice"
import { organizationsSlice } from "@/features/organizations/organizations.slice"
import { projectsSlice } from "@/features/projects/projects.slice"
import { listenerMiddleware } from "./listenerMiddleware"
import type { ThunkExtraArg } from "./types"

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    me: meSlice.reducer,
    organizations: organizationsSlice.reducer,
    projects: projectsSlice.reducer,
    chatBots: chatBotsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: { services: getServices() } satisfies ThunkExtraArg,
      },
    }).prepend(listenerMiddleware.middleware),
})

// Re-export types for convenience (they're defined in types.ts to avoid circular deps)
export type { AppDispatch, RootState, ThunkExtraArg } from "./types"
