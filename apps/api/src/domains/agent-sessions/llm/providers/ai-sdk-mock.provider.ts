import type { LanguageModelV3StreamPart } from "@ai-sdk/provider"
import { AgentModel } from "@caseai-connect/api-contracts"
import { Injectable, NotImplementedException } from "@nestjs/common"
import { type LanguageModel, simulateReadableStream } from "ai"
import { MockLanguageModelV3 } from "ai/test"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { AgentProvider } from "@/domains/agent-sessions/llm/agent-provider"
import { AISDKLLMProviderBase } from "@/domains/agent-sessions/llm/ai-sdk-llm-provider-base"

@Injectable()
export class AISDKMockProvider extends AISDKLLMProviderBase {
  getAgentProvider(): AgentProvider {
    return AgentProvider._Mock
  }
  getLanguageModel(config: LLMConfig): LanguageModel {
    switch (config.model) {
      case AgentModel._MockGenerateText:
      case AgentModel._MockProcessFiles:
        return this.getMockForGenerateText(config)
      case AgentModel._MockGenerateObject:
        return this.getMockForGenerateObject(config)
      case AgentModel._MockStreamChatResponse:
        return this.getMockForStreamChatResponse(config)
      default:
        throw new NotImplementedException(`Mock : invalid model: ${config.model}`)
    }
  }
  getMockForGenerateText(config: LLMConfig): LanguageModel {
    let result: string = `Hello, I'm the ${config.model === AgentModel._MockGenerateText ? "generateText" : "processFiles"} default mock response!`
    if (config.mockResult && !Array.isArray(config.mockResult)) {
      result = config.mockResult
    }
    return new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [{ type: "text", text: result }],
        finishReason: { unified: "stop", raw: undefined },
        usage: this.usage,
        warnings: [],
      }),
    })
  }

  getMockForStreamChatResponse(config: LLMConfig): LanguageModel {
    let results: string[] = [`Hel`, `lo, I'm`, ` the streamChatResponse default mo`, `ck!`]
    if (config.mockResult && Array.isArray(config.mockResult)) {
      results = config.mockResult
    }
    return new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "text-start", id: "text-1" },
            ...results.map<LanguageModelV3StreamPart>((r) => ({
              type: "text-delta",
              id: "text-1",
              delta: r,
            })),
            { type: "text-end", id: "text-1" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: undefined },
              logprobs: undefined,
              usage: this.usage,
            },
          ],
        }),
      }),
    })
  }

  getMockForGenerateObject(config: LLMConfig): LanguageModel {
    let result: string = `{"content":"Hello, I'm the generateObject default mock response!", "source":"MOCK"}`
    if (config.mockResult && !Array.isArray(config.mockResult)) {
      result = config.mockResult
    }
    return new MockLanguageModelV3({
      doGenerate: async () => ({
        content: [{ type: "text", text: result }],
        finishReason: { unified: "stop", raw: undefined },
        usage: this.usage,
        warnings: [],
      }),
    })
  }
  getTags(config: LLMConfig): string[] {
    return ["MOCK-LLM", config.model]
  }

  readonly usage = {
    inputTokens: {
      total: 0,
      noCache: 0,
      cacheRead: undefined,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: 0,
      text: 0,
      reasoning: undefined,
    },
  }
}
