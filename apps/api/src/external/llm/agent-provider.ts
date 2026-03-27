import { AgentModel } from "@caseai-connect/api-contracts"

export function GetAgentModelKeyFromValue(model: string) {
  return Object.keys(AgentModel).find((key) => AgentModel[key as keyof typeof AgentModel] === model)
}
