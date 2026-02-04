import "./open-telemetry-init" // !!!! first import !!!!

import { createVertex } from "@ai-sdk/google-vertex"
import { Injectable } from "@nestjs/common"
import { streamText } from "ai"
import type {
  ChatMessage,
  LLMConfig,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"

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
  ): AsyncGenerator<string, void, unknown> {
    const inputMetadata = messages[0]?.inputMetadata ? messages[0].inputMetadata : undefined
    // Convert normalized messages to ai-sdk format
    // Filter out empty messages and system messages (handled separately)
    const aiSDKMessages = messages
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
      .filter((msg) => msg !== undefined) as Array<{ role: "user" | "assistant"; content: string }>

    // Ensure we have at least one message (required by Gemini API)
    if (aiSDKMessages.length === 0) {
      throw new Error("Cannot stream response: no valid messages provided")
    }

    // Get system message if present
    const systemMessage = messages.find((msg) => msg.role === "system")?.content

    // Set 'LLM' tags
    const tags = [this.vertexProject, this.vertexLocation, config.model]

    // Stream using ai-sdk
    const result = streamText({
      model: this.vertexProvider(config.model),
      messages: aiSDKMessages,
      system: systemMessage || config.systemPrompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: `LLMProvider.streamChatResponse [${aiSDKMessages.filter((m) => m.role === "assistant").length + 1} rounds]`, //+1 => current round
        metadata: {
          langfuseTraceId: inputMetadata?.chatSessionId || "", //fixme: create a specific field for traceId in ChatSession entity ?
          sessionId: inputMetadata?.chatSessionId ? `cs:${inputMetadata?.chatSessionId}` : "",
          userId: inputMetadata?.organizationId
            ? `o:${inputMetadata?.organizationId} / p:${inputMetadata?.projectId}`
            : "",
          tags: [...tags, ...(inputMetadata?.tags || [])],
        },
      },
    })
    // Yield text chunks
    for await (const chunk of result.textStream) {
      yield chunk
    }
  }
}
