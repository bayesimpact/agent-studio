import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2StreamPart,
  LanguageModelV2Usage,
} from "@ai-sdk/provider"

type ProviderConfig = {
  baseURL: string
  apiKey?: string
}

export function createChatCompletionsProviderV2(config: ProviderConfig) {
  const { baseURL, apiKey } = config

  return function model(modelId: string): LanguageModelV2 {
    return {
      specificationVersion: "v2",
      provider: "custom-chat-completions",
      modelId,
      supportedUrls: {},

      /** Generate text (non-stream) */
      async doGenerate(options: LanguageModelV2CallOptions) {
        const messages = normalizePrompt(options.prompt)

        const body = {
          model: modelId,
          messages,
          tools: convertTools(options.tools),
          temperature: options.temperature,
          max_tokens: options.maxOutputTokens,
        }

        const res = await fetch(`${baseURL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify(body),
        })

        const json = await res.json()
        const choice = json.choices?.[0]
        const message = choice?.message

        const content: LanguageModelV2Content[] = []

        if (message?.content) {
          content.push({ type: "text", text: message.content })
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
          finishReason: (choice?.finish_reason as LanguageModelV2FinishReason) || "stop",
          usage: (json.usage ?? {}) as LanguageModelV2Usage,
          warnings: [] as LanguageModelV2CallWarning[],
          providerMetadata: {},
        }
      },

      /** Streaming (doStream) */
      async doStream(options: LanguageModelV2CallOptions) {
        const messages = normalizePrompt(options.prompt)

        const body = {
          model: modelId,
          messages,
          tools: convertTools(options.tools),
          temperature: options.temperature,
          stream: true,
        }

        const res = await fetch(`${baseURL}/v1/chat/completions`, {
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
}
function headersToRecord(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {}
  headers.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}
/** Convert prompt to array of messages */
function normalizePrompt(prompt: any): any[] {
  if (!prompt) return []
  if (typeof prompt === "string") return [{ role: "user", content: prompt }]
  if (Array.isArray(prompt)) return prompt.map((m) => ({ role: m.role, content: m.content }))
  return []
}

/** Convert tools to OpenAI-compatible functions */
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

/** Safe JSON parse */
function safeParse(str: string) {
  try {
    return JSON.parse(str)
  } catch {
    return {}
  }
}
