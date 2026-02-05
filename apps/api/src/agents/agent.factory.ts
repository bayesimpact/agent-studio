import { randomUUID } from "node:crypto"
import { AgentLocale, AgentModel } from "@caseai-connect/api-contracts"
import { Factory } from "fishery"
import type { Project } from "@/projects/project.entity"
import type { Agent } from "./agent.entity"

type AgentTransientParams = {
  project: Project
}

class AgentFactory extends Factory<Agent, AgentTransientParams> {}

export const agentFactory = AgentFactory.define(({ sequence, params, transientParams }) => {
  if (!transientParams.project) {
    throw new Error("project transient is required")
  }

  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test Chat Bot ${sequence}`,
    defaultPrompt: params.defaultPrompt || `This is a test default prompt for bot ${sequence}`,
    model: params.model || AgentModel.Gemini25Flash,
    temperature: params.temperature ?? 0.7,
    locale: params.locale || AgentLocale.EN,
    projectId: transientParams.project.id,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    deletedAt: params.deletedAt || null,
    project: transientParams.project,
    chatSessions: params.chatSessions || [],
  } satisfies Agent
})
