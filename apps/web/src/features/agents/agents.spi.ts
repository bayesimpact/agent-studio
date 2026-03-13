import type { DocumentTagsUpdateFields } from "../document-tags/document-tags.models"
import type { Agent } from "./agents.models"

export interface IAgentsSpi {
  getAll: (params: { organizationId: string; projectId: string }) => Promise<Agent[]>
  createOne: (
    params: { organizationId: string; projectId: string },
    payload: Pick<Agent, "name" | "defaultPrompt" | "model" | "locale" | "temperature" | "type"> &
      Partial<Pick<Agent, "outputJsonSchema">> &
      DocumentTagsUpdateFields,
  ) => Promise<Agent>
  updateOne: (
    params: { organizationId: string; projectId: string; agentId: string },
    payload: Partial<
      Pick<
        Agent,
        "name" | "defaultPrompt" | "model" | "locale" | "temperature" | "type" | "outputJsonSchema"
      > &
        DocumentTagsUpdateFields
    >,
  ) => Promise<void>
  deleteOne: (params: {
    organizationId: string
    projectId: string
    agentId: string
  }) => Promise<void>
}
