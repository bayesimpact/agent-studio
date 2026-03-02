import "../open-telemetry-init" // !!!! first import !!!!
import { createOpenResponses } from "@ai-sdk/open-responses"
import type { OpenResponsesProvider } from "@ai-sdk/open-responses/src/open-responses-provider"
import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai"
import { createOpenAICompatible, type OpenAICompatibleProvider } from "@ai-sdk/openai-compatible"
import type { LanguageModelV3 } from "@ai-sdk/provider"
import { Injectable, NotImplementedException } from "@nestjs/common"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { AISDKLLMProviderBase, CallOrigin } from "@/external/llm/ai-sdk-llm-provider-base"
import { CustomMedGemmaLanguageModel } from "@/external/llm/providers/custom-med-gemma-language-model"
import { AgentProvider } from "../agent-provider"

@Injectable()
export class AISDKMedGemmaProvider extends AISDKLLMProviderBase {
  getAgentProvider(): AgentProvider {
    return AgentProvider.MedGemma
  }
  private readonly openResponsesProvider: OpenResponsesProvider
  private readonly openAIProvider: OpenAIProvider
  private readonly openAICompatibleProvider: OpenAICompatibleProvider
  private readonly providerName: string
  private readonly baseUrl: string

  constructor() {
    super()
    this.baseUrl = process.env.VLLM_MEDGEMMA_15_URL ?? ""
    this.providerName = "medgemma provider"
    this.openResponsesProvider = createOpenResponses({
      name: this.providerName,
      url: new URL("v1/responses", this.baseUrl).toString(),
    })
    this.openAIProvider = createOpenAI({
      name: this.providerName,
      baseURL: new URL("v1", this.baseUrl).toString(),
      apiKey: "<unused>", //fixme
    })
    this.openAICompatibleProvider = createOpenAICompatible({
      name: this.providerName,
      baseURL: new URL("v1", this.baseUrl).toString(),
      apiKey: "<unused>", //fixme
    })
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
        return this.openResponsesProvider(config.model)
      // return this.openAIProvider(config.model) // ai-sdk auto switch to OpenAi-like-call when OpenResponses not implemented (I think)
      case CallOrigin.streamChatResponse:
      case CallOrigin.generateChatResponseWithTools:
        return this.openAIProvider(config.model)
      // return this.openAICompatibleProvider(config.model)
      case CallOrigin.generateStructuredOutput:
      case CallOrigin.processFiles:
        return this.getCustomProvider(config)
      default:
        throw new NotImplementedException(`DEV - Unknown callOrigin: ${callOrigin}`)
    }
  }
  getCustomProvider(config: LLMConfig): LanguageModelV3 {
    return new CustomMedGemmaLanguageModel(this.baseUrl, config) as LanguageModelV3
  }
  getTags(config: LLMConfig): string[] {
    return [this.providerName, config.model]
  }
}
