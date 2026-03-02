import type {
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2Prompt,
  LanguageModelV2StreamPart,
  LanguageModelV2Text,
  LanguageModelV2Usage,
} from "@ai-sdk/provider/"
import { Injectable, NotImplementedException } from "@nestjs/common"
import type { LanguageModel } from "ai"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { AgentProvider } from "@/external/llm/agent-provider"
import { AISDKLLMProviderBase, type CallOrigin } from "@/external/llm/ai-sdk-llm-provider-base"

@Injectable()
export class AISDKMedGemmaV2Provider extends AISDKLLMProviderBase {
  private readonly baseUrl: string
  private readonly providerName: string
  constructor() {
    super()
    this.baseUrl = process.env.VLLM_MEDGEMMA_15_URL ?? ""
    this.providerName = "medgemma provider v2"
  }

  getAgentProvider(): AgentProvider {
    return AgentProvider.MedGemma
  }
  getLanguageModel({ config }: { config: LLMConfig; callOrigin: CallOrigin }): LanguageModel {
    {
      const apiKey = "<unused-api-key>" // fixme pass thru config when exists
      const url_responses = new URL("v1/responses", this.baseUrl).toString()
      const url_chat_completions = new URL("v1/chat/completions", this.baseUrl).toString()
      return {
        specificationVersion: "v2",
        provider: this.providerName,
        modelId: config.model,
        supportedUrls: {},

        async doGenerate(options: LanguageModelV2CallOptions) {
          const messages = normalizePromptInMessages(options.prompt)
          const { prompt, ...rest } = options

          const body = {
            ...rest,
            model: config.model,
            // prompt: normalizePromptInline(options.prompt),
            input: messages,
          }

          const fetchOptions: RequestInit = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify(body),
          }

          const res = await fetch(url_responses, fetchOptions)

          const json = await res.json()
          const message = json.output?.[0]

          const content: LanguageModelV2Content[] = []

          if (message?.content) {
            content.push({ type: "text", text: message.content[0].text })
          }

          if (message?.tool_calls) {
            for (const call of message.tool_calls) {
              content.push({
                type: "tool-call",
                toolCallId: call.id,
                toolName: call.function?.name,
                input: safeParse(call.function?.arguments ?? ""),
              })
            }
          }

          return {
            content,
            finishReason: (message?.finish_reason as LanguageModelV2FinishReason) || "stop",
            usage: (json.usage ?? {}) as LanguageModelV2Usage,
            warnings: [] as LanguageModelV2CallWarning[],
            providerMetadata: {},
          }
        },

        async doStream(options: LanguageModelV2CallOptions) {
          const messages = normalizePrompt(options.prompt)

          const body = {
            model: config.model,
            messages,
            tools: convertTools(options.tools),
            temperature: options.temperature,
            stream: true,
          }

          const res = await fetch(url_chat_completions, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify(body),
          })

          const reader = res.body!.getReader()
          const decoder = new TextDecoder()

          const stream = new ReadableStream<LanguageModelV2StreamPart>({
            async start(controller) {
              let buffer = ""

              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() ?? ""

                for (const line of lines) {
                  if (!line.startsWith("data:")) continue
                  const jsonStr = line.replace("data:", "").trim()
                  if (jsonStr === "[DONE]") {
                    controller.close()
                    return
                  }

                  const data = JSON.parse(jsonStr)
                  const delta = data.choices?.[0]?.delta
                  if (!delta) continue

                  if (delta.content) {
                    controller.enqueue({
                      type: "text-delta",
                      delta: delta.content,
                      id: crypto.randomUUID(),
                    })
                  }

                  if (delta.tool_calls) {
                    for (const call of delta.tool_calls) {
                      controller.enqueue({
                        type: "tool-call",
                        toolCallId: call.id,
                        toolName: call.function?.name,
                        input: call.function?.arguments ?? "",
                      })
                    }
                  }
                }
              }

              controller.close()
            },
          })

          return {
            stream,
            request: { body: body as unknown } as { body?: unknown },
            response: { headers: headersToRecord(res.headers) } as {
              headers?: Record<string, string>
            },
          }
        },
      }
    }

    function headersToRecord(headers: Headers): Record<string, string> {
      const obj: Record<string, string> = {}
      headers.forEach((value, key) => {
        obj[key] = value
      })
      return obj
    }
    function normalizePrompt(prompt: any): any[] {
      if (!prompt) return []
      if (typeof prompt === "string") return [{ role: "user", content: prompt }]
      if (Array.isArray(prompt)) return prompt.map((m) => ({ role: m.role, content: m.content }))
      return []
    }
    function _normalizePromptInline(
      prompt: {
        role: string
        content: string | LanguageModelV2Content[]
      }[],
    ): string {
      return prompt.map((p) => promptInline(p)).join("\n")
    }
    function promptInline(prompt: {
      role: string
      content: string | LanguageModelV2Content[]
    }): string {
      if (typeof prompt.content === "string") {
        if (prompt.role === "system") return prompt.content
        return `${prompt.role}: ${prompt.content}`
      } else {
        const value = prompt.content[0] as LanguageModelV2Text
        if (
          value &&
          typeof value === "object" &&
          (value as any).type === "text" &&
          typeof (value as any).text === "string"
        )
          return `${prompt.role}: ${value?.text}`
      }
      return ""
    }
    function normalizePromptInMessages(
      prompt: LanguageModelV2Prompt,
    ): { role: string; content: string }[] {
      // @ts-expect-error
      return prompt.map((p) => promptInMessage(p))
    }
    function promptInMessage(prompt: {
      role: string
      content: string | LanguageModelV2Content[]
    }): {
      role: string
      content: string
    } {
      if (typeof prompt.content === "string") {
        return { role: prompt.role, content: prompt.content }
      } else {
        const value = prompt.content[0] as LanguageModelV2Text
        if (
          value &&
          typeof value === "object" &&
          (value as any).type === "text" &&
          typeof (value as any).text === "string"
        )
          return { role: prompt.role, content: value.text }
      }
      throw new NotImplementedException("promptInMessage : unmanaged case")
    }

    function convertTools(tools: any) {
      if (!tools) return undefined
      return Object.entries(tools).map(([name, tool]: any) => ({
        type: "function",
        function: {
          name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }))
    }

    function safeParse(str: string) {
      try {
        return JSON.parse(str)
      } catch {
        return {}
      }
    }
  }

  getTags(config: LLMConfig): string[] {
    return [this.providerName, config.model]
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
