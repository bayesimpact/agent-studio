import type { AgentModel, AgentTemperature } from "@caseai-connect/api-contracts"
import { NotImplementedException } from "@nestjs/common"
import type { ToolSet } from "ai"
import type { LLMConfig, LLMProvider } from "@/common/interfaces/llm-provider.interface"
import { AgentModelToAgentProvider, AgentProvider } from "@/external/llm/agent-provider"

export abstract class ServiceWithLLM {
  constructor(mockLlmProvider: LLMProvider, vertexLlmProvider: LLMProvider) {
    this._mockLlmProvider = mockLlmProvider
    this.vertexLlmProvider = vertexLlmProvider
  }
  private readonly _mockLlmProvider: LLMProvider
  private readonly vertexLlmProvider: LLMProvider
  protected getProviderForModel(model: string): LLMProvider {
    const provider = AgentModelToAgentProvider[model]
    switch (provider) {
      case AgentProvider._Mock:
        return this._mockLlmProvider
      case AgentProvider.Vertex:
        return this.vertexLlmProvider
      default:
        throw new NotImplementedException(`not supported llm provider: ${provider}`)
    }
  }
  protected buildLLMConfig({
    systemPrompt,
    model,
    temperature,
    tools,
  }: {
    tools?: ToolSet
    systemPrompt: string
    model: AgentModel
    temperature: AgentTemperature
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
    return {
      model,
      temperature: safeTemperature,
      systemPrompt,
      tools,
    } as LLMConfig
  }
}
