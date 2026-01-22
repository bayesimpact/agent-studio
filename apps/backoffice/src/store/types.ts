import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit"
import type { authSlice } from "@/features/auth/auth.slice"
import type { chatBotsSlice } from "@/features/chat-bots/chat-bots.slice"
import type { meSlice } from "@/features/me/me.slice"
import type { organizationsSlice } from "@/features/organizations/organizations.slice"
import type { projectsSlice } from "@/features/projects/projects.slice"
import type { testSlice } from "@/features/test/test.slice"

// Define the store state structure without creating the store
// This allows us to use these types in listenerMiddleware without circular dependencies
export type RootState = {
  auth: ReturnType<typeof authSlice.reducer>
  me: ReturnType<typeof meSlice.reducer>
  organizations: ReturnType<typeof organizationsSlice.reducer>
  projects: ReturnType<typeof projectsSlice.reducer>
  chatBots: ReturnType<typeof chatBotsSlice.reducer>
  test: ReturnType<typeof testSlice.reducer>
}

export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>
