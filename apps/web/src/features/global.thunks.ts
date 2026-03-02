import { createAsyncThunk } from "@reduxjs/toolkit"
import type { RootState, ThunkExtraArg } from "@/store"
import type { Agent } from "./agents/agents.models"
import type { ConversationAgentSession } from "./agents/conversation-agent-sessions/conversation-agent-sessions.models"
import { selectIsAdminInterface } from "./auth/auth.selectors"
import type { Project } from "./projects/projects.models"

type ThunkConfig = { state: RootState; extra: ThunkExtraArg }

export const initOrganization = createAsyncThunk<
  {
    projects: Project[]
    agents: Record<Project["id"], Agent[]>
    agentSessions: Record<Agent["id"], ConversationAgentSession[]>
  },
  { organizationId: string },
  ThunkConfig
>("init/organization", async ({ organizationId }, { extra: { services }, getState }) => {
  const state = getState()
  const isAdminInterface = selectIsAdminInterface(state)
  const projects = await services.projects.getAll(organizationId)
  const agents: Record<Project["id"], Agent[]> = {}
  const agentSessions: Record<Agent["id"], ConversationAgentSession[]> = {}

  for (const project of projects) {
    const agts = await services.agents.getAll({ organizationId, projectId: project.id })
    agents[project.id] = agts

    for (const agent of agts) {
      if (isAdminInterface) {
        const sessions = await services.conversationAgentSessions.getAllPlaygroundSessions({
          organizationId,
          projectId: project.id,
          agentId: agent.id,
        })
        agentSessions[agent.id] = sessions
      } else {
        const sessions = await services.conversationAgentSessions.getAllAppSessions({
          organizationId,
          projectId: project.id,
          agentId: agent.id,
        })
        agentSessions[agent.id] = sessions
      }
    }
  }

  return { projects, agents, agentSessions }
})
