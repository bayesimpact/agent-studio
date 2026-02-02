import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { ChatBot } from "./chat-bots/chat-bots.models"
import type { ChatSession } from "./chat-sessions/chat-sessions.models"
import type { Project } from "./projects/projects.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const initOrganization = createAsyncThunk<
  {
    projects: Project[]
    chatBots: Record<Project["id"], ChatBot[]>
    chatSessions: Record<ChatBot["id"], ChatSession[]>
  },
  { organizationId: string },
  ThunkConfig
>("init/organization", async ({ organizationId }, { extra: { services }, getState }) => {
  const state = getState()
  const isAdmin = state.auth.isAdmin
  const projects = await services.projects.getAll(organizationId)
  const chatBots: Record<Project["id"], ChatBot[]> = {}
  const chatSessions: Record<ChatBot["id"], ChatSession[]> = {}

  for (const project of projects) {
    const bots = await services.chatBots.getAll({ projectId: project.id })
    chatBots[project.id] = bots

    for (const bot of bots) {
      if (isAdmin) {
        const sessions = await services.chatSessions.getAllPlayground(bot.id)
        chatSessions[bot.id] = sessions
      } else {
        const sessions = await services.chatSessions.getAllApp(bot.id)
        chatSessions[bot.id] = sessions
      }
    }
  }

  return { projects, chatBots, chatSessions }
})
