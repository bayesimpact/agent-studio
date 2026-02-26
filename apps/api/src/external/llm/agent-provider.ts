import { AgentModel } from "@caseai-connect/api-contracts"

export enum AgentProvider {
  Vertex = "VERTEX",
  _Mock = "MOCK",
}
export const AgentModelToAgentProvider: Record<AgentModel, AgentProvider> = {
  [AgentModel.Gemini25Flash]: AgentProvider.Vertex,
  [AgentModel.Gemini25Pro]: AgentProvider.Vertex,
  [AgentModel._MockGenerateObject]: AgentProvider._Mock,
  [AgentModel._MockGenerateText]: AgentProvider._Mock,
  [AgentModel._MockProcessFiles]: AgentProvider._Mock,
  [AgentModel._MockRate]: AgentProvider._Mock,
  [AgentModel._MockStreamChatResponse]: AgentProvider._Mock,
}
