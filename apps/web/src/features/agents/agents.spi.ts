import type { Agent } from "./agents.models"

export interface IAgentsSpi {
  getAll: (params: { projectId: string }) => Promise<Agent[]>
  createOne: (
    params: { projectId: string },
    payload: Pick<Agent, "name" | "defaultPrompt" | "model" | "locale" | "temperature">,
  ) => Promise<Agent>
  updateOne: (
    params: { agentId: string; projectId: string },
    payload: Partial<Pick<Agent, "name" | "defaultPrompt" | "model" | "locale" | "temperature">>,
  ) => Promise<void>
  deleteOne: (params: { agentId: string; projectId: string }) => Promise<void>
}
