import "./open-telemetry-init" // !!!! first import !!!!
import { NotImplementedException } from "@nestjs/common"
import {
  type FilePart,
  generateText,
  jsonSchema,
  type LanguageModel,
  Output,
  streamText,
  type TextPart,
} from "ai"
import type { ZodObject, z } from "zod"
import type {
  LLMChatMessage,
  LLMConfig,
  LLMFile,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
import { removeNullish } from "@/common/utils/remove-nullish"
import { AgentModelToAgentProvider, type AgentProvider } from "@/external/llm/agent-provider"

export abstract class AISDKLLMProviderBase implements LLMProvider {
  async *streamChatResponse({
    messages,
    config,
    metadata,
  }: {
    messages: LLMChatMessage[]
    config: LLMConfig
    metadata: LLMMetadata
  }): AsyncGenerator<string, void, unknown> {
    this.checkConfigProviderAndModel(config)
    // Convert normalized messages to ai-sdk format
    // Filter out empty messages and system messages (handled separately)
    const aiSDKMessages: LLMChatMessage[] = messages
      .map((message) => {
        if (message.role === "system") {
          // ai-sdk handles system messages separately
          return undefined
        }
        // Skip messages with empty content (Gemini requires non-empty parts field)
        // if (!message.content || message.content.trim().length === 0) {
        //   return undefined
        // }
        return {
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        }
      })
      .filter((msg) => msg !== undefined) as LLMChatMessage[]

    // Ensure we have at least one message (required by Gemini API)
    if (aiSDKMessages.length === 0) {
      throw new Error("Cannot stream response: no valid messages provided")
    }

    // Get system message if present
    const systemMessage = messages.find((msg) => msg.role === "system")?.content

    // Stream using ai-sdk
    const result = streamText({
      model: this.getLanguageModel(config),
      messages: aiSDKMessages,
      system: systemMessage || config.systemPrompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: this.buildFunctionIdForStreamChatResponse(aiSDKMessages),
        metadata: this.buildMetadata({ config, metadata }),
      },
    })
    // Yield text chunks
    for await (const chunk of result.textStream) {
      yield chunk
    }
  }
  async generateChatResponse({
    message,
    config,
    metadata,
  }: {
    message: LLMChatMessage
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<string> {
    // Convert normalized messages to ai-sdk format
    // Filter out empty messages and system messages (handled separately)
    const aiSDKMessages: LLMChatMessage[] = [message]
      .map((message) => {
        if (message.role === "system") {
          // ai-sdk handles system messages separately
          return undefined
        }
        // Skip messages with empty content (Gemini requires non-empty parts field)
        // if (!message.content || message.content.trim().length === 0) {
        //   return undefined
        // }
        return {
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        }
      })
      .filter((msg) => msg !== undefined) as LLMChatMessage[]

    // Ensure we have at least one message (required by Gemini API)
    if (aiSDKMessages.length === 0) {
      throw new Error("Cannot stream response: no valid messages provided")
    }

    // Stream using ai-sdk
    const result = await generateText({
      model: this.getLanguageModel(config),
      messages: aiSDKMessages,
      system: config.systemPrompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: this.buildFunctionIdForStreamChatResponse(aiSDKMessages),
        metadata: this.buildMetadata({ config, metadata }),
      },
    })
    return result.text
  }
  async generateText({
    prompt,
    config,
    metadata,
  }: {
    prompt: string
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<string> {
    const { text } = await generateText({
      model: this.getLanguageModel(config),
      system: config.systemPrompt,
      prompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "LLMProvider.generateText",
        metadata: this.buildMetadata({ config, metadata }),
      },
    })
    return text
  }

  // biome-ignore lint/suspicious/noExplicitAny: @did : une idée
  async generateObject<T extends ZodObject<any>>({
    schema,
    prompt,
    config,
    metadata,
  }: {
    schema: T
    prompt: string
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<z.infer<T>> {
    const res = await generateText({
      model: this.getLanguageModel(config),
      system: config.systemPrompt,
      prompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "LLMProvider.generateObject",
        metadata: this.buildMetadata({ config, metadata }),
      },
      output: Output.object({
        schema: schema,
      }),
    })
    return schema.parse(res.output)
  }

  async generateStructuredOutput({
    message,
    schema,
    config,
    metadata,
  }: {
    message: LLMChatMessage
    schema: Record<string, unknown>
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<Record<string, unknown>> {
    const aiSDKMessages: LLMChatMessage[] = [message]
      .map((currentMessage) => {
        if (currentMessage.role === "system") {
          return undefined
        }
        return {
          role: currentMessage.role === "assistant" ? "assistant" : "user",
          content: currentMessage.content,
        }
      })
      .filter((currentMessage) => currentMessage !== undefined) as LLMChatMessage[]

    if (aiSDKMessages.length === 0) {
      throw new Error("Cannot generate structured output: no valid messages provided")
    }

    const result = await generateText({
      model: this.getLanguageModel(config),
      messages: aiSDKMessages,
      system: config.systemPrompt,
      temperature: config.temperature,
      output: Output.object({
        schema: jsonSchema<Record<string, unknown>>(schema),
      }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "LLMProvider.generateStructuredOutput",
        metadata: this.buildMetadata({ config, metadata }),
      },
    })

    return result.output
  }

  async processFiles({
    prompt,
    files,
    config,
    metadata,
  }: {
    prompt: string
    files: LLMFile[]
    config: LLMConfig
    metadata: LLMMetadata
  }): Promise<string> {
    const content = [
      {
        type: "text",
        text: prompt,
      } as TextPart,
      ...files.map<FilePart>((f) => ({
        type: "file",
        data: f.content,
        mediaType: f.mediaType,
        name: f.name,
      })),
    ]
    const { text } = await generateText({
      model: this.getLanguageModel(config),
      system: config.systemPrompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "LLMProvider.processFiles",
        metadata: this.buildMetadata({ config, metadata }),
      },
      messages: [
        {
          role: "user",
          content,
        },
      ],
    })
    return text
  }

  private checkConfigProviderAndModel(config: LLMConfig): void {
    const provider = AgentModelToAgentProvider[config.model]
    if (provider !== this.getAgentProvider())
      throw new NotImplementedException(
        `missing or invalid association between agent provider (${provider}) and agent model (${config.model})`,
      )
  }

  private buildFunctionIdForStreamChatResponse(aiSDKMessages: LLMChatMessage[]): string {
    return `LLMProvider.streamChatResponse [${aiSDKMessages.filter((m) => m.role === "assistant").length + 1} turn(s)]` //+1 => current turn
  }

  private buildMetadata({
    config,
    metadata,
  }: {
    config: LLMConfig
    metadata: LLMMetadata
  }): Record<string, string | number | string[]> {
    return removeNullish({
      langfuseTraceId: metadata.traceId,
      sessionId: `as:${metadata.agentSessionId}`,
      userId: `o:${metadata.organizationId} / p:${metadata.projectId}`,
      tags: [...this.getTags(config), ...(metadata?.tags || [])],
      currentTurn: metadata.currentTurn,
    })
  }

  abstract getLanguageModel(config: LLMConfig): LanguageModel
  abstract getTags(config: LLMConfig): string[]
  abstract getAgentProvider(): AgentProvider
}

// biome-ignore lint/correctness/noUnusedVariables: used in class AISDKLLMProvider
namespace AISDKLLMProviderBase {
  export type AiSDKMessages = {
    role: "user" | "assistant"
    content: string
  }
}
