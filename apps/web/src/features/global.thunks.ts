import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { AgentSession } from "./agent-sessions/agent-sessions.models"
import type { Agent } from "./agents/agents.models"
import { selectIsAdminInterface } from "./auth/auth.selectors"
import type { Project } from "./projects/projects.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const initOrganization = createAsyncThunk<
  {
    projects: Project[]
    agents: Record<Project["id"], Agent[]>
    agentSessions: Record<Agent["id"], AgentSession[]>
  },
  { organizationId: string },
  ThunkConfig
>("init/organization", async ({ organizationId }, { extra: { services }, getState }) => {
  const state = getState()
  const isAdminInterface = selectIsAdminInterface(state)
  const projects = await services.projects.getAll(organizationId)
  const agents: Record<Project["id"], Agent[]> = {}
  const agentSessions: Record<Agent["id"], AgentSession[]> = {}

  for (const project of projects) {
    const bots = await services.agents.getAll({ organizationId, projectId: project.id })
    agents[project.id] = bots

    for (const bot of bots) {
      if (isAdminInterface) {
        const sessions = await services.agentSessions.getAllPlaygroundSessions({
          organizationId,
          projectId: project.id,
          agentId: bot.id,
        })
        agentSessions[bot.id] = sessions
      } else {
        const sessions = await services.agentSessions.getAllAppSessions({
          organizationId,
          projectId: project.id,
          agentId: bot.id,
        })
        agentSessions[bot.id] = sessions
      }
    }
  }

  return { projects, agents, agentSessions }
})
