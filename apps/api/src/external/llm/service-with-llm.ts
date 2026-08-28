import {
  type AgentModel,
  AgentModelToAgentProvider,
  AgentProvider,
  type AgentTemperature,
} from "@caseai-connect/api-contracts"
import { NotImplementedException } from "@nestjs/common"
import type { ToolSet } from "ai"
import type {
  LLMConfig,
  LLMFeatures,
  LLMProvider,
  LLMServiceTier,
} from "@/common/interfaces/llm-provider.interface"

export abstract class ServiceWithLLM {
  constructor({
    mockLlmProvider,
    vertexLlmProvider,
    vertex3LlmProvider,
    mistralLlmProvider,
    medGemmaLlmProvider,
    gemmaLlmProvider,
  }: {
    mockLlmProvider: LLMProvider
    vertexLlmProvider: LLMProvider
    vertex3LlmProvider: LLMProvider
    mistralLlmProvider: LLMProvider
    medGemmaLlmProvider: LLMProvider
    gemmaLlmProvider: LLMProvider
  }) {
    this._mockLlmProvider = mockLlmProvider
    this.vertexLlmProvider = vertexLlmProvider
    this.vertex3LlmProvider = vertex3LlmProvider
    this.mistralLlmProvider = mistralLlmProvider
    this.medGemmaLlmProvider = medGemmaLlmProvider
    this.gemmaLlmProvider = gemmaLlmProvider
  }
  private readonly _mockLlmProvider: LLMProvider
  private readonly vertexLlmProvider: LLMProvider
  private readonly vertex3LlmProvider: LLMProvider
  private readonly mistralLlmProvider: LLMProvider
  private readonly medGemmaLlmProvider: LLMProvider
  private readonly gemmaLlmProvider: LLMProvider
  protected getProviderForModel(model: string): LLMProvider {
    const provider = AgentModelToAgentProvider[model]
    switch (provider) {
      case AgentProvider._Mock:
        return this._mockLlmProvider
      case AgentProvider.Vertex:
        return this.vertexLlmProvider
      case AgentProvider.Vertex3:
        return this.vertex3LlmProvider
      case AgentProvider.Mistral:
        return this.mistralLlmProvider
      case AgentProvider.MedGemma:
        return this.medGemmaLlmProvider
      case AgentProvider.Gemma:
        return this.gemmaLlmProvider
      default:
        throw new NotImplementedException(`not supported llm provider: ${provider}`)
    }
  }
  protected buildLLMConfig({
    systemPrompt,
    model,
    temperature,
    tools,
    fireAndForgetToolNames,
    endOfTurnTools,
    endOfTurnExecutionCounts,
    useExtendedTimeouts,
    priorityCallsEnabled,
    llmFeatures,
  }: {
    tools?: ToolSet
    fireAndForgetToolNames?: string[]
    endOfTurnTools?: ToolSet
    endOfTurnExecutionCounts?: (toolResult: { toolName: string; output: unknown }) => boolean
    systemPrompt: string
    model: AgentModel
    temperature: AgentTemperature
    useExtendedTimeouts?: boolean
    priorityCallsEnabled: boolean
    llmFeatures: LLMFeatures
  }): LLMConfig {
    // Convert temperature to number (database decimal types may be returned as strings)
    const safeTemperature =
      typeof temperature === "string" ? parseFloat(temperature) : Number(temperature)

    // Validate temperature is a valid number
    if (Number.isNaN(safeTemperature) || safeTemperature < 0 || safeTemperature > 2) {
      throw new Error(
        `Invalid temperature value: ${safeTemperature}. Temperature must be a number between 0 and 2.`,
      )
    }
    let serviceTier: LLMServiceTier
    if (
      llmFeatures?.priorityCalls &&
      priorityCallsEnabled &&
      AgentModelToAgentProvider[model] === AgentProvider.Vertex3
    ) {
      serviceTier = "priority"
    }
    return {
      model,
      temperature: safeTemperature,
      systemPrompt,
      tools,
      fireAndForgetToolNames,
      endOfTurnTools,
      endOfTurnExecutionCounts,
      useExtendedTimeouts,
      serviceTier,
    } as LLMConfig
  }
}
