import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit"
import type { Services } from "@/di/services"
import type { authSliceReducer } from "@/features/auth/auth.slice"
import type { chatBotsSliceReducer } from "@/features/chat-bots/chat-bots.slice"
import type { chatSessionsSliceReducer } from "@/features/chat-sessions/chat-sessions.slice"
import type { meSliceReducer } from "@/features/me/me.slice"
import type { notificationsSliceReducer } from "@/features/notifications/notifications.slice"
import type { organizationsSliceReducer } from "@/features/organizations/organizations.slice"
import type { projectsSliceReducer } from "@/features/projects/projects.slice"
import type { resourcesSliceReducer } from "@/features/resources/resources.slice"

// Define the store state structure without creating the store
// This allows us to use these types in listenerMiddleware without circular dependencies
export type RootState = {
  auth: ReturnType<typeof authSliceReducer>
  chatBots: ReturnType<typeof chatBotsSliceReducer>
  chatSessions: ReturnType<typeof chatSessionsSliceReducer>
  me: ReturnType<typeof meSliceReducer>
  notifications: ReturnType<typeof notificationsSliceReducer>
  organizations: ReturnType<typeof organizationsSliceReducer>
  projects: ReturnType<typeof projectsSliceReducer>
  resources: ReturnType<typeof resourcesSliceReducer>
}

// Extra argument passed to thunks for dependency injection
export type ThunkExtraArg = {
  services: Services
}

export type AppDispatch = ThunkDispatch<RootState, ThunkExtraArg, UnknownAction>
