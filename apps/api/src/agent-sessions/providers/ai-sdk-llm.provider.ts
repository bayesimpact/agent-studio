import "./open-telemetry-init" // !!!! first import !!!!

import { createVertex } from "@ai-sdk/google-vertex"
import { Injectable } from "@nestjs/common"
import { streamText } from "ai"
import type {
  ChatMessage,
  LLMConfig,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
import { removeNullish } from "@/common/utils/remove-nullish"

@Injectable()
export class AISDKLLMProvider implements LLMProvider {
  private readonly vertexProvider: ReturnType<typeof createVertex>
  private readonly vertexProject: string
  private readonly vertexLocation: string

  constructor() {
    this.vertexProject =
      process.env.GCP_PROJECT || process.env.GOOGLE_VERTEX_PROJECT || "caseai-connect"
    this.vertexLocation =
      process.env.LOCATION || process.env.GOOGLE_VERTEX_LOCATION || "europe-west1"
    this.vertexProvider = createVertex({
      project: this.vertexProject,
      location: this.vertexLocation,
    })
  }

  async *streamChatResponse(
    messages: ChatMessage[],
    config: LLMConfig,
    metadata: LLMMetadata,
  ): AsyncGenerator<string, void, unknown> {
    // Convert normalized messages to ai-sdk format
    // Filter out empty messages and system messages (handled separately)
    const aiSDKMessages: AISDKLLMProvider.AiSDKMessages[] = messages
      .map((message) => {
        if (message.role === "system") {
          // ai-sdk handles system messages separately
          return undefined
        }
        // Skip messages with empty content (Gemini requires non-empty parts field)
        if (!message.content || message.content.trim().length === 0) {
          return undefined
        }
        return {
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        }
      })
      .filter((msg) => msg !== undefined) as Array<AISDKLLMProvider.AiSDKMessages>

    // Ensure we have at least one message (required by Gemini API)
    if (aiSDKMessages.length === 0) {
      throw new Error("Cannot stream response: no valid messages provided")
    }

    // Get system message if present
    const systemMessage = messages.find((msg) => msg.role === "system")?.content

    // Stream using ai-sdk
    const result = streamText({
      model: this.vertexProvider(config.model),
      messages: aiSDKMessages,
      system: systemMessage || config.systemPrompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: this.buildFunctionId(aiSDKMessages),
        metadata: this.buildMetadata(config, metadata),
      },
    })
    // Yield text chunks
    for await (const chunk of result.textStream) {
      yield chunk
    }
  }

  buildFunctionId(aiSDKMessages: AISDKLLMProvider.AiSDKMessages[]): string {
    return `LLMProvider.streamChatResponse [${aiSDKMessages.filter((m) => m.role === "assistant").length + 1} turn(s)]` //+1 => current turn
  }

  buildMetadata(
    config: LLMConfig,
    metadata: LLMMetadata,
  ): Record<string, string | number | string[]> {
    const tags = [this.vertexProject, this.vertexLocation, config.model]
    return removeNullish({
      langfuseTraceId: metadata.chatSessionId || "", //fixme: create a specific field for traceId in ChatSession entity ?
      sessionId: metadata.chatSessionId ? `cs:${metadata.chatSessionId}` : "",
      userId: metadata.organizationId
        ? `o:${metadata.organizationId} / p:${metadata.projectId}`
        : "",
      tags: [...tags, ...(metadata?.tags || [])],
      currentTurn: metadata.currentTurn,
    })
  }
}

// biome-ignore lint/correctness/noUnusedVariables: used in class AISDKLLMProvider
namespace AISDKLLMProvider {
  export type AiSDKMessages = {
    role: "user" | "assistant"
    content: string
  }
}
