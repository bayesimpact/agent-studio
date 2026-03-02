import { AgentModel } from "@caseai-connect/api-contracts"

export enum AgentProvider {
  MedGemma = "MED-GEMMA",
  Vertex = "VERTEX",
  _Mock = "MOCK",
}
export const AgentModelToAgentProvider: Record<AgentModel, AgentProvider> = {
  [AgentModel.Gemini25Flash]: AgentProvider.Vertex,
  [AgentModel.Gemini25Pro]: AgentProvider.Vertex,
  [AgentModel.MedGemma15_4B_LanguageModelV2]: AgentProvider.MedGemma,
  [AgentModel.MedGemma15_4B]: AgentProvider.MedGemma,
  [AgentModel._MockGenerateObject]: AgentProvider._Mock,
  [AgentModel._MockGenerateStructuredOutput]: AgentProvider._Mock,
  [AgentModel._MockGenerateText]: AgentProvider._Mock,
  [AgentModel._MockProcessFiles]: AgentProvider._Mock,
  [AgentModel._MockRate]: AgentProvider._Mock,
  [AgentModel._MockStreamChatResponse]: AgentProvider._Mock,
}
