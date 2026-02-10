import type { Agent } from "./agents.models"

export interface IAgentsSpi {
  getAll: (params: { organizationId: string; projectId: string }) => Promise<Agent[]>
  createOne: (
    params: { organizationId: string; projectId: string },
    payload: Pick<Agent, "name" | "defaultPrompt" | "model" | "locale" | "temperature">,
  ) => Promise<Agent>
  updateOne: (
    params: { organizationId: string; projectId: string; agentId: string },
    payload: Partial<Pick<Agent, "name" | "defaultPrompt" | "model" | "locale" | "temperature">>,
  ) => Promise<void>
  deleteOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<void>
}
