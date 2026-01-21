import { configureStore } from "@reduxjs/toolkit"
import { authSlice } from "@/features/auth/auth.slice"
import { chatTemplatesSlice } from "@/features/chat-templates/chat-templates.slice"
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
    chatTemplates: chatTemplatesSlice.reducer,
    test: testSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
