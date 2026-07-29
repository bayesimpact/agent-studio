import type { LanguageModelV3 } from "@ai-sdk/provider"
import { AgentModelToAgentProvider, AgentProvider } from "@caseai-connect/api-contracts"
import { Logger, NotImplementedException } from "@nestjs/common"
import { trace } from "@opentelemetry/api"
import {
  type FilePart,
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
  ToolLoopAgent,
  wrapLanguageModel,
} from "ai"
import { type ZodObject, z } from "zod"
import type {
  LLMChatMessage,
  LLMConfig,
  LLMFile,
  LLMMetadata,
  LLMProvider,
} from "@/common/interfaces/llm-provider.interface"
import { removeNullish } from "@/common/utils/remove-nullish"
import { fireAndForgetStopCondition } from "@/external/llm/fire-and-forget-stop-condition"
import { ResponseHelper } from "@/external/llm/response-helper"
import { ThoughtTokensHelper } from "@/external/llm/thought-tokens-helper"

// OTel attribute keys under which we publish the raw LLM request body and
// response. The `ai.telemetry.metadata.` prefix is required so the AI SDK
// accepts the attribute and so LangfuseIntegrationExporter picks it up.
// The exporter recognises these specific keys and surfaces them together
// as a dedicated child span (named "llm.call") under each generation,
// with the request as input and the response as output, instead of
// burying them in the metadata blob.
export const RAW_LLM_REQUEST_ATTR = "ai.telemetry.metadata.rawLlmRequest"
export const RAW_LLM_RESPONSE_ATTR = "ai.telemetry.metadata.rawLlmResponse"
export const RAW_LLM_RESPONSE_STRIPPED_ATTR = "ai.telemetry.metadata.rawLlmResponseStripped"

function extractTextFromContent(content: unknown): string {
  if (!Array.isArray(content)) return ""
  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        typeof part === "object" &&
        part !== null &&
        (part as { type?: unknown }).type === "text" &&
        typeof (part as { text?: unknown }).text === "string",
    )
    .map((part) => part.text)
    .join("")
}

function extractTextFromStreamChunks(chunks: unknown[]): string {
  let text = ""
  for (const chunk of chunks) {
    if (
      typeof chunk === "object" &&
      chunk !== null &&
      (chunk as { type?: unknown }).type === "text-delta" &&
      typeof (chunk as { delta?: unknown }).delta === "string"
    ) {
      text += (chunk as { delta: string }).delta
    }
  }
  return text
}

export abstract class AISDKLLMProviderBase implements LLMProvider {
  private readonly endOfTurnLogger = new Logger("EndOfTurnTools")
  protected getLanguageModelWithRawCapture(args: {
    config: LLMConfig
    callOrigin: CallOrigin
  }): LanguageModelV3 {
    const baseModel = this.getLanguageModel(args)
    return wrapLanguageModel({
      model: baseModel,
      middleware: {
        specificationVersion: "v3",
        wrapGenerate: async ({ doGenerate }) => {
          const result = await doGenerate()
          try {
            const activeSpan = trace.getActiveSpan()
            const req = result.request?.body
            if (req !== undefined) {
              activeSpan?.setAttribute(
                RAW_LLM_REQUEST_ATTR,
                typeof req === "string" ? req : JSON.stringify(req),
              )
            }
            const raw = result.response?.body ?? result.content
            const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw)
            activeSpan?.setAttribute(RAW_LLM_RESPONSE_ATTR, rawStr)
            const originalText = extractTextFromContent(result.content)
            if (originalText !== "") {
              const strippedText = ThoughtTokensHelper.removeThoughtTokens(originalText)
              if (strippedText !== originalText) {
                activeSpan?.setAttribute(RAW_LLM_RESPONSE_STRIPPED_ATTR, strippedText)
              }
            }
          } catch {
            // never let telemetry capture break the generation
          }
          // Apply thought-token stripping to text parts so downstream code
          // (ai-sdk consumers, our wrapper methods) sees cleaned content.
          try {
            if (Array.isArray(result.content)) {
              // biome-ignore lint/suspicious/noExplicitAny: content shape varies by provider
              ;(result as any).content = result.content.map((part: unknown) => {
                if (
                  typeof part === "object" &&
                  part !== null &&
                  (part as { type?: unknown }).type === "text" &&
                  typeof (part as { text?: unknown }).text === "string"
                ) {
                  const original = (part as { text: string }).text
                  return { ...part, text: ThoughtTokensHelper.removeThoughtTokens(original) }
                }
                return part
              })
            }
          } catch {
            // never let token stripping break the generation
          }
          return result
        },
        wrapStream: async ({ doStream }) => {
          const { stream, ...rest } = await doStream()
          try {
            const req = rest.request?.body
            if (req !== undefined) {
              trace
                .getActiveSpan()
                ?.setAttribute(
                  RAW_LLM_REQUEST_ATTR,
                  typeof req === "string" ? req : JSON.stringify(req),
                )
            }
          } catch {
            // never let telemetry capture break the stream
          }
          const rawChunks: unknown[] = []
          let stripper: ReturnType<typeof ThoughtTokensHelper.createStripper> | null = null
          let currentTextId: string | undefined
          const transformed = stream.pipeThrough(
            new TransformStream({
              transform(chunk, controller) {
                // biome-ignore lint/suspicious/noExplicitAny: stream chunk shape varies by provider
                const c = chunk as any
                rawChunks.push(chunk)
                if (c?.type === "text-start") {
                  stripper = ThoughtTokensHelper.createStripper()
                  currentTextId = typeof c.id === "string" ? c.id : undefined
                  controller.enqueue(chunk)
                } else if (
                  c?.type === "text-delta" &&
                  typeof c.delta === "string" &&
                  stripper !== null
                ) {
                  const cleaned = stripper.feed(c.delta)
                  if (cleaned) controller.enqueue({ ...c, delta: cleaned })
                } else if (c?.type === "text-end") {
                  if (stripper !== null) {
                    const tail = stripper.flush()
                    if (tail) {
                      controller.enqueue(
                        currentTextId !== undefined
                          ? { type: "text-delta", id: currentTextId, delta: tail }
                          : { type: "text-delta", delta: tail },
                      )
                    }
                    stripper = null
                    currentTextId = undefined
                  }
                  controller.enqueue(chunk)
                } else {
                  controller.enqueue(chunk)
                }
              },
              flush(controller) {
                if (stripper !== null) {
                  const tail = stripper.flush()
                  if (tail) {
                    controller.enqueue(
                      currentTextId !== undefined
                        ? { type: "text-delta", id: currentTextId, delta: tail }
                        : { type: "text-delta", delta: tail },
                    )
                  }
                  stripper = null
                  currentTextId = undefined
                }
                try {
                  const grouped = ResponseHelper.groupStreamChunksForReadability(rawChunks)
                  const groupedStr = JSON.stringify(grouped)
                  const activeSpan = trace.getActiveSpan()
                  activeSpan?.setAttribute(RAW_LLM_RESPONSE_ATTR, groupedStr)
                  const originalText = extractTextFromStreamChunks(rawChunks)
                  if (originalText !== "") {
                    const strippedText = ThoughtTokensHelper.removeThoughtTokens(originalText)
                    if (strippedText !== originalText) {
                      activeSpan?.setAttribute(RAW_LLM_RESPONSE_STRIPPED_ATTR, strippedText)
                    }
                  }
                } catch {
                  // never let telemetry capture break the stream
                }
              },
            }),
          )
          return { stream: transformed, ...rest }
        },
      },
    })
  }

  async *streamChatResponse({
    messages,
    config,
    metadata,
  }: {
    messages: LLMChatMessage[]
    config: LLMConfig
    metadata: LLMMetadata
  }): AsyncGenerator<string, void, unknown> {
    const callOrigin = config.tools
      ? CallOrigin.streamChatResponse_withTools
      : CallOrigin.streamChatResponse
    this.checkConfigProviderAndModel(config)
    const aiSDKMessages: LLMChatMessage[] = messages
      .map((message) => {
        if (message.role === "system") {
          return undefined
        }
        return {
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        }
      })
      .filter((msg) => msg !== undefined) as LLMChatMessage[]

    if (aiSDKMessages.length === 0) {
      throw new Error("Cannot stream response: no valid messages provided")
    }

    const systemMessage = messages.find((msg) => msg.role === "system")?.content
    const functionId = this.buildFunctionIdForStreamChatResponse(aiSDKMessages)

    const toolActivationPrerequisites = config.toolActivationPrerequisites ?? {}
    const agent = new ToolLoopAgent({
      model: this.getLanguageModelWithRawCapture({ config, callOrigin }),
      temperature: config.temperature,
      tools: config.tools,
      // Hide gated tools until their prerequisite tool was called in this
      // turn (e.g. the turn summary's sources variant only exists once the
      // knowledge base was actually queried).
      ...(Object.keys(toolActivationPrerequisites).length > 0
        ? {
            prepareStep: ({
              steps,
            }: {
              steps: Array<{ toolCalls: Array<{ toolName: string }> }>
            }) => {
              const calledToolNames = new Set(
                steps.flatMap((step) => step.toolCalls.map((toolCall) => toolCall.toolName)),
              )
              const inactiveToolNames = Object.entries(toolActivationPrerequisites)
                .filter(([, prerequisite]) => !calledToolNames.has(prerequisite))
                .map(([toolName]) => toolName)
              if (inactiveToolNames.length === 0) return {}
              return {
                activeTools: Object.keys(config.tools ?? {}).filter(
                  (toolName) => !inactiveToolNames.includes(toolName),
                ),
              }
            },
          }
        : {}),
      // Keep the default step safety net, but skip the follow-up generation
      // when a step only ran fire-and-forget tools (their output is noise).
      ...(config.fireAndForgetToolNames?.length
        ? {
            stopWhen: [
              stepCountIs(20),
              fireAndForgetStopCondition({
                fireAndForgetToolNames: config.fireAndForgetToolNames,
              }),
            ],
          }
        : {}),
      experimental_telemetry: {
        isEnabled: true,
        functionId,
        metadata: this.buildMetadata({ config, metadata }),
      },
      providerOptions: {
        custom: this.buildCustomProviderOptions({ config, callOrigin, metadata }),
      },
    })

    let systemPrompt = systemMessage || config.systemPrompt || ""
    systemPrompt = this.applySpecificToSystemPrompt({ systemPrompt, config, callOrigin })
    const systemMessagePart = systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }]
      : []

    const fullMessages = [...systemMessagePart, ...aiSDKMessages]
    const streamResult = await agent.stream({ messages: fullMessages })

    for await (const chunk of streamResult.textStream) {
      yield chunk
    }

    await this.runEndOfTurnTools({
      config,
      callOrigin,
      metadata,
      functionId,
      messages: fullMessages,
      streamResult,
    })
  }

  /**
   * Guarantees the end-of-turn tools (e.g. submit_turn_summary) ran on this turn.
   * They are declared in the answering loop, so a cooperative model (Gemma)
   * calls them in the same generation as its answer — zero extra cost. When
   * the loop finished without calling them (Gemini Flash never volunteers
   * bookkeeping calls), ONE forced generation (toolChoice "required",
   * restricted to the missing tools) runs on top of the produced answer.
   * Already-called tools are skipped so nothing executes twice.
   * "required" is used rather than a named tool_choice because named forcing
   * is silently ignored by the vLLM gemma4 parser on 0.26.0.
   *
   * Best-effort: the user already received the streamed answer, so a failure
   * here is logged but never breaks the stream.
   */
  private async runEndOfTurnTools({
    config,
    callOrigin,
    metadata,
    functionId,
    messages,
    streamResult,
  }: {
    config: LLMConfig
    callOrigin: CallOrigin
    metadata: LLMMetadata
    /**
     * MUST be the same functionId as the answering loop: the langfuse
     * exporter names the whole trace after the first resource.name it sees,
     * and langfuse.trace() upserts — a distinct functionId here renames the
     * user-facing trace to the bookkeeping call's name.
     */
    functionId: string
    messages: LLMChatMessage[]
    streamResult: {
      steps: PromiseLike<Array<{ toolResults: Array<{ toolName: string; output: unknown }> }>>
      response: PromiseLike<{ messages: LLMChatMessage[] }>
    }
  }): Promise<void> {
    const endOfTurnTools = config.endOfTurnTools
    if (!endOfTurnTools || Object.keys(endOfTurnTools).length === 0) return

    try {
      // Skip the tools the loop already EXECUTED — forcing them again would
      // run their side effects twice. Executions (toolResults), not calls:
      // a voluntary call with invalid arguments never executes and must not
      // suppress the forced retry. Executions flagged endOfTurnNoOp recorded
      // nothing (e.g. an empty {} report) and do not count either.
      const steps = await streamResult.steps
      const executedToolNames = new Set(
        steps.flatMap((step) =>
          step.toolResults
            .filter(
              (toolResult) =>
                (toolResult.output as { endOfTurnNoOp?: boolean } | undefined)?.endOfTurnNoOp !==
                true,
            )
            .map((toolResult) => toolResult.toolName),
        ),
      )
      const missingEndOfTurnTools = Object.fromEntries(
        Object.entries(endOfTurnTools).filter(([toolName]) => !executedToolNames.has(toolName)),
      )
      if (Object.keys(missingEndOfTurnTools).length === 0) return

      const responseMessages = (await streamResult.response).messages
      const endOfTurnResult = await generateText({
        model: this.getLanguageModelWithRawCapture({ config, callOrigin }),
        messages: [
          ...messages,
          ...responseMessages,
          // Some providers (Vertex gemini-3.5-flash-lite and newer) reject
          // requests ending with a model turn — close with an explicit user
          // instruction for the bookkeeping call. Phrased so its content
          // never leaks into the report (a session got titled "Demande de
          // résumé de tour" after an earlier wording of this message).
          {
            role: "user",
            content:
              "(bookkeeping, not a user message) Call the required tool now. Base its content ONLY on the conversation above — ignore this message entirely.",
          },
        ],
        temperature: config.temperature,
        tools: missingEndOfTurnTools,
        toolChoice: "required",
        experimental_telemetry: {
          isEnabled: true,
          functionId,
          // Distinguish the forced bookkeeping generation from the answering
          // loop in langfuse via metadata, not functionId (see above).
          metadata: { ...this.buildMetadata({ config, metadata }), endOfTurnTools: true },
        },
        providerOptions: {
          custom: this.buildCustomProviderOptions({ config, callOrigin, metadata }),
        },
      })
      // toolChoice "required" guarantees a call was EMITTED, not that it was
      // EXECUTED: invalid arguments or a provider quirk leave toolResults
      // empty and the report silently skipped — make that loud.
      if (endOfTurnResult.toolResults.length === 0) {
        this.endOfTurnLogger.error(
          `end-of-turn tools produced no executed result (calls: ${JSON.stringify(
            endOfTurnResult.toolCalls.map((toolCall) => toolCall.toolName),
          )}, finishReason: ${endOfTurnResult.finishReason})`,
        )
      }
    } catch (error) {
      this.endOfTurnLogger.error(
        `end-of-turn tools call failed: ${error instanceof Error ? error.message : error}`,
      )
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
    const callOrigin = CallOrigin.generateChatResponse
    this.checkConfigProviderAndModel(config)
    const aiSDKMessages: LLMChatMessage[] = [message]
      .map((message) => {
        if (message.role === "system") {
          return undefined
        }
        return {
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        }
      })
      .filter((msg) => msg !== undefined) as LLMChatMessage[]

    if (aiSDKMessages.length === 0) {
      throw new Error("Cannot stream response: no valid messages provided")
    }

    const result = await generateText({
      model: this.getLanguageModelWithRawCapture({ config, callOrigin }),
      messages: aiSDKMessages,
      system: config.systemPrompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: this.buildFunctionIdForStreamChatResponse(aiSDKMessages),
        metadata: this.buildMetadata({ config, metadata }),
      },
      providerOptions: {
        custom: this.buildCustomProviderOptions({ config, callOrigin, metadata }),
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
    const callOrigin = CallOrigin.generateText
    this.checkConfigProviderAndModel(config)
    const { text } = await generateText({
      model: this.getLanguageModelWithRawCapture({ config, callOrigin }),
      system: config.systemPrompt,
      prompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "LLMProvider.generateText",
        metadata: this.buildMetadata({ config, metadata }),
      },
      providerOptions: {
        custom: this.buildCustomProviderOptions({ config, callOrigin, metadata }),
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
    const callOrigin = CallOrigin.generateObject
    this.checkConfigProviderAndModel(config)
    const res = await generateText({
      model: this.getLanguageModelWithRawCapture({ config, callOrigin }),
      system: config.systemPrompt,
      prompt,
      temperature: config.temperature,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "LLMProvider.generateObject",
        metadata: this.buildMetadata({
          config,
          metadata,
          schema: schema.toJSONSchema() as JSONSchema7,
        }),
      },
      output: Output.object({
        schema: schema,
      }),
      providerOptions: {
        custom: this.buildCustomProviderOptions({
          config,
          callOrigin,
          metadata,
          schema: schema.toJSONSchema() as JSONSchema7,
        }),
      },
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
    const callOrigin = CallOrigin.generateStructuredOutput
    this.checkConfigProviderAndModel(config)
    if (AgentModelToAgentProvider[config.model] === AgentProvider._Mock) {
      const fakeFile: LLMFile = {
        type: "file",
        name: "file1.pdf",
        mediaType: "application/pdf",
        content: Buffer.from("%PDF-1.4\n%%EOF"),
      }
      message = {
        role: "user",
        content: [
          { type: "text", text: "prompt" },
          {
            type: fakeFile.type as "file",
            mediaType: fakeFile.mediaType,
            data: fakeFile.content,
            filename: fakeFile.name,
          },
        ],
      }
    }
    //Gemma and Mistral restriction: no pdf
    if (
      AgentModelToAgentProvider[config.model] === AgentProvider.Gemma ||
      AgentModelToAgentProvider[config.model] === AgentProvider.Mistral
    ) {
      if (Array.isArray(message.content)) {
        const filePart = message.content.find((p): p is FilePart => p.type === "file")
        if (filePart?.mediaType === "application/pdf") {
          throw new Error(`Model cannot process ${filePart?.mediaType} file`)
        }
      }
    }

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
      model: this.getLanguageModelWithRawCapture({ config, callOrigin }),
      messages: aiSDKMessages,
      system: config.systemPrompt,
      temperature: config.temperature,
      output: Output.object({
        schema: jsonSchema<Record<string, unknown>>(schema),
      }),
      experimental_telemetry: {
        isEnabled: true,
        functionId: "LLMProvider.generateStructuredOutput",
        metadata: this.buildMetadata({
          config,
          metadata,
          schema,
        }),
      },
      providerOptions: {
        custom: this.buildCustomProviderOptions({
          config,
          callOrigin,
          metadata,
          schema,
        }),
      },
    })
    if (
      AgentModelToAgentProvider[config.model] === AgentProvider.MedGemma ||
      AgentModelToAgentProvider[config.model] === AgentProvider.Gemma
    ) {
      // @ts-expect-error
      return JSON.parse(result?.steps[0]?.content[0]?.text)
    }
    return result.output
  }
  // biome-ignore lint/suspicious/noExplicitAny: Zod def
  private recordToZodSchema(record: Record<string, unknown>): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {}

    for (const [key, value] of Object.entries(record)) {
      shape[key] = this.inferZodType(value)
    }

    return z.object(shape)
  }

  private inferZodType(value: unknown): z.ZodTypeAny {
    if (typeof value === "string") return z.string()
    if (typeof value === "number") return z.number()
    if (typeof value === "boolean") return z.boolean()
    if (value === null) return z.null()

    if (Array.isArray(value)) {
      if (value.length === 0) return z.array(z.any())
      return z.array(this.inferZodType(value[0]))
    }

    if (typeof value === "object") {
      return this.recordToZodSchema(value as Record<string, unknown>)
    }

    return z.any()
  }

  private checkConfigProviderAndModel(config: LLMConfig): void {
    const provider = AgentModelToAgentProvider[config.model]
    if (provider !== this.getAgentProvider())
      throw new NotImplementedException(
        `DEV - missing or invalid association between agent provider (${provider}) and agent model (${config.model})`,
      )
  }

  private buildFunctionIdForStreamChatResponse(aiSDKMessages: LLMChatMessage[]): string {
    return `LLMProvider.streamChatResponse [${aiSDKMessages.filter((m) => m.role === "assistant").length + 1} turn(s)]` //+1 => current turn
  }

  private buildMetadata({
    config,
    metadata,
    schema,
  }: {
    config: LLMConfig
    metadata: LLMMetadata
    schema?: JSONSchema7
  }): Record<string, string | number | string[]> {
    return removeNullish({
      langfuseTraceId: metadata.traceId,
      sessionId: `as:${metadata.langfuseSessionId ?? metadata.agentSessionId}`,
      userId: `o:${metadata.organizationId} / p:${metadata.projectId}`,
      tags: [...(metadata?.tags || []), ...this.getTags(config)],
      currentTurn: metadata.currentTurn,
      revision: metadata.revision,
      outputSchema: JSON.stringify(schema),
      availableTools: JSON.stringify(config.tools),
    })
  }

  private buildCustomProviderOptions({
    config,
    callOrigin,
    metadata,
    schema,
  }: {
    config: LLMConfig
    callOrigin: CallOrigin
    metadata: LLMMetadata
    schema?: JSONSchema7
  }) {
    return {
      callOrigin,
      agentId: metadata.agentId,
      metadata: this.buildMetadata({ config, metadata, schema }),
    }
  }

  abstract getLanguageModel({ config, callOrigin }: { config: LLMConfig; callOrigin: CallOrigin })
  abstract getTags(config: LLMConfig): string[]
  abstract getAgentProvider(): AgentProvider

  applySpecificToSystemPrompt({
    // biome-ignore lint/correctness/noUnusedFunctionParameters: used in override
    config,
    systemPrompt,
    // biome-ignore lint/correctness/noUnusedFunctionParameters: used in override
    callOrigin,
  }: {
    config: LLMConfig
    systemPrompt: string
    callOrigin: CallOrigin
  }): string {
    return systemPrompt
  }
}

export enum CallOrigin {
  streamChatResponse = "streamChatResponse",
  streamChatResponse_withTools = "streamChatResponse_withTools",
  generateChatResponse = "generateChatResponse",
  generateText = "generateText",
  generateObject = "generateObject",
  generateStructuredOutput = "generateStructuredOutput",
}
