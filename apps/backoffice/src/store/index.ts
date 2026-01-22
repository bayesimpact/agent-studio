import { configureStore } from "@reduxjs/toolkit"
import { authSlice } from "@/features/auth/auth.slice"
import { chatBotsSlice } from "@/features/chat-bots/chat-bots.slice"
import { meSlice } from "@/features/me/me.slice"
import { organizationsSlice } from "@/features/organizations/organizations.slice"
import { projectsSlice } from "@/features/projects/projects.slice"
import { testSlice } from "@/features/test/test.slice"
import { listenerMiddleware } from "./listenerMiddleware"

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    me: meSlice.reducer,
    organizations: organizationsSlice.reducer,
    projects: projectsSlice.reducer,
    chatBots: chatBotsSlice.reducer,
    test: testSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
})

// Re-export types for convenience (they're defined in types.ts to avoid circular deps)
export type { AppDispatch, RootState } from "./types"
