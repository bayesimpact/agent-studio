import { createOpenResponses } from "@ai-sdk/open-responses"
import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModelV3 } from "@ai-sdk/provider"
import { AgentProvider } from "@caseai-connect/api-contracts"
import { Injectable, NotImplementedException } from "@nestjs/common"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { GetAgentModelKeyFromValue } from "@/external/llm/agent-provider"
import { AISDKLLMProviderBase, CallOrigin } from "@/external/llm/ai-sdk-llm-provider-base"
import { CustomMedGemmaLanguageModel } from "@/external/llm/providers/custom-med-gemma-language-model"

@Injectable()
export class AISDKMedGemmaProvider extends AISDKLLMProviderBase {
  getAgentProvider(): AgentProvider {
    return AgentProvider.MedGemma
  }
  private readonly providerName: string

  constructor() {
    super()
    this.providerName = "Medgemma Provider"
  }

  getLanguageModel({
    config,
    callOrigin,
  }: {
    config: LLMConfig
    callOrigin: CallOrigin
  }): LanguageModelV3 {
    switch (callOrigin) {
      case CallOrigin.generateText:
      case CallOrigin.generateChatResponse:
      case CallOrigin.generateObject:
        return this.getOpenResponsesProvider(config)
      case CallOrigin.streamChatResponse:
        return this.getOpenAiProvider(config)
      case CallOrigin.generateStructuredOutput:
      case CallOrigin.streamChatResponse_withTools:
        return this.getCustomProvider(config)
      default:
        throw new NotImplementedException(`DEV - Unknown callOrigin: ${callOrigin}`)
    }
  }
  getOpenResponsesProvider(config: LLMConfig): LanguageModelV3 {
    const { url, apiKey } = this.getModelEnvSettings(config.model)
    return createOpenResponses({
      name: this.providerName,
      url: new URL("v1/responses", url).toString(),
      apiKey,
    })(config.model)
  }
  getOpenAiProvider(config: LLMConfig): LanguageModelV3 {
    const { url, apiKey } = this.getModelEnvSettings(config.model)
    return createOpenAI({
      name: this.providerName,
      baseURL: new URL("v1", url).toString(),
      apiKey,
    })(config.model)
  }
  getCustomProvider(config: LLMConfig): LanguageModelV3 {
    const { url, apiKey } = this.getModelEnvSettings(config.model)
    return new CustomMedGemmaLanguageModel({ config, baseUrl: url, apiKey }) as LanguageModelV3
  }
  getModelEnvSettings(model: string) {
    const agentModelKey = GetAgentModelKeyFromValue(model)
    const envKeyUrl = `VLLM_${agentModelKey?.toUpperCase()}_URL`
    if (!process.env[envKeyUrl])
      throw new NotImplementedException(`DEV - Missing environment variable: ${envKeyUrl}`)
    const envKeyApiKey = `VLLM_${agentModelKey?.toUpperCase()}_APIKEY`
    if (!process.env[envKeyApiKey])
      throw new NotImplementedException(`DEV - Missing environment variable: ${envKeyApiKey}`)
    return { url: process.env[envKeyUrl], apiKey: process.env[envKeyApiKey] }
  }
  getTags(config: LLMConfig): string[] {
    return [this.providerName, config.model]
  }
}
