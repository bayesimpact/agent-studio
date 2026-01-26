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

  constructor() {
    this.vertexProvider = createVertex({
      project: process.env.GCP_PROJECT || process.env.GOOGLE_VERTEX_PROJECT || "caseai-connect",
      location: process.env.LOCATION || process.env.GOOGLE_VERTEX_LOCATION || "europe-west1",
    })
  }

  async *streamChatResponse(
    messages: ChatMessage[],
    config: LLMConfig,
  ): AsyncGenerator<string, void, unknown> {
    // Convert normalized messages to ai-sdk format
    const aiSDKMessages = messages
      .map((message) => {
        if (message.role === "system") {
          // ai-sdk handles system messages separately
          return undefined
        }
        return {
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        }
      })
      .filter((msg) => msg !== undefined) as Array<{ role: "user" | "assistant"; content: string }>

    // Get system message if present
    const systemMessage = messages.find((msg) => msg.role === "system")?.content

    // Stream using ai-sdk
    const result = await streamText({
      model: this.vertexProvider(config.model),
      messages: aiSDKMessages,
      system: systemMessage || config.systemPrompt,
      temperature: config.temperature,
    })

    // Yield text chunks
    for await (const chunk of result.textStream) {
      yield chunk
    }
  }
}
