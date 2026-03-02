/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: <explanation> */
import type {
  LanguageModelV2Text,
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
  LanguageModelV3StreamResult,
  SharedV3Warning,
} from "@ai-sdk/provider"
import { NotImplementedException } from "@nestjs/common"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"

class LanguageModelV3Prompt {}

export class BkpCustomLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = "v3"
  readonly provider: string
  readonly modelId: string
  readonly baseUrl: string
  readonly apiKey: string

  constructor(baseUrl: string, config: LLMConfig, apiKey?: string) {
    this.baseUrl = new URL("v1", baseUrl).toString()
    this.apiKey = apiKey ?? "undefined"
    this.provider = "custom med-gemma"
    this.modelId = config.model.split(":")[0] ?? ""
  }

  // Convert AI SDK prompt to provider format
  private getArgs(options: LanguageModelV3CallOptions) {
    const warnings: SharedV3Warning[] = []

    // Map messages to provider format
    const messages = this.convertToProviderMessages(options.prompt)

    // Handle tools if provided
    const tools = undefined

    // Build request body
    const body = {
      model: this.modelId,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stop: options.stopSequences,
      tools,
    }

    return { args: body, warnings }
  }
  normalizePromptInMessages(prompt: LanguageModelV3Prompt): { role: string; content: string }[] {
    // @ts-expect-error
    return prompt.map((p) => promptInMessage(p))
  }
  promptInMessage(prompt: { role: string; content: string | LanguageModelV3Content[] }): {
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
  async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
    const warnings: SharedV3Warning[] = []
    const messages = this.convertToProviderMessages(options.prompt)
    const input = this.extractPromptContentsAsInput(options.prompt)
    const useOpenResponses =
      messages.some(
        (message) =>
          message.role !== "system" && message.content.some((part) => part.type === "image"),
      ) || options.responseFormat

    let url: string
    let body: string

    if (useOpenResponses) {
      // const input = this.convertToPromptInline(options.prompt)
      // const input = this.convertPromptToResponsesInput(options.prompt)
      url = new URL("v1/responses", this.baseUrl).toString()
      body = JSON.stringify({
        model: this.modelId,
        input,
        temperature: options.temperature,
        max_tokens: options.maxOutputTokens,
        tools: undefined,
        // response_format: {
        //   type: "json_schema",
        //   json_schema: options.responseFormat,
        // },
      })
    } else {
      url = new URL("v1/chat/completions", this.baseUrl).toString()
      body = JSON.stringify({
        model: this.modelId,
        messages,
        temperature: options.temperature,
        max_tokens: options.maxOutputTokens,
        stop: options.stopSequences,
        tools: undefined,
      })
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body,
    })
    const text = await res.text()
    console.log("RAW RESPONSE:", text)

    const data = await res.json()

    // Convert provider response to AI SDK format
    const content: LanguageModelV3Content[] = []

    // Extract text content
    if (!options.responseFormat && data.choices[0].message.content) {
      content.push({
        type: "text",
        text: data.choices[0].message.content,
      })
    }
    if (options.responseFormat && data.output[0].content[0].text) {
      content.push({
        type: "text",
        text: data.output[0].content[0].text,
      })
    }

    return {
      content,
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: {
          total: data.usage.prompt_tokens,
          noCache: undefined,
          cacheRead: undefined,
          cacheWrite: undefined,
        },
        outputTokens: {
          total: data.usage.completion_tokens,
          text: data.usage.completion_tokens,
          reasoning: undefined,
        },
      },
      request: { body },
      response: { body: data },
      warnings,
    }
  }

  async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
    const { args } = this.getArgs(options)

    // Create streaming response
    const _response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ ...args, stream: true }),
      signal: options.abortSignal,
    })

    // Transform stream to AI SDK format
    // @ts-expect-error
    const stream: ReadableStream<LanguageModelV3StreamPart> = undefined
    //     response.body!.pipeThrough(
    //   new TextDecoderStream(),
    // )
    // .pipeThrough(this.createParser())
    // .pipeThrough(this.createTransformer(warnings))

    return { stream }
  }
  private convertToProviderMessages(prompt: LanguageModelV3Prompt) {
    // @ts-expect-error
    return prompt.map((message) => {
      switch (message.role) {
        case "system":
          return { role: "system", content: message.content }

        case "user":
          return {
            role: "user",
            content: message.content.map((part) => {
              switch (part.type) {
                case "text":
                  return { type: "text", text: part.text }
                case "file":
                  return {
                    type: "image",
                    image: part.data,
                  }
                default:
                  throw new Error(`Unsupported part type: ${part.type}`)
              }
            }),
          }

        // case "assistant":
        //   // Handle assistant messages with text, tool calls, etc.
        //   return this.convertAssistantMessage(message)
        //
        // case "tool":
        //   // Handle tool results
        //   return this.convertToolMessage(message)

        default:
          throw new Error(`Unsupported message role: ${message.role}`)
      }
    })
  }

  private convertToPromptInline(prompt: LanguageModelV3Prompt): string {
    // @ts-expect-error
    return prompt.map((p) => this.promptInline(p)).join("\n")
  }
  private promptInline(prompt: {
    role: string
    content: string | LanguageModelV3Content[]
  }): string {
    if (typeof prompt.content === "string") {
      // if (prompt.role === "system") return prompt.content
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

  private extractPromptContentsAsInput(prompt: LanguageModelV3Prompt) {
    // @ts-expect-error
    return prompt.map((p) => this.toInput(p))
  }
  private toInput(prompt: { role: string; content: string | LanguageModelV3Content[] }) {
    if (typeof prompt.content === "string") {
      return { role: prompt.role, content: prompt.content }
    } else {
      const contents: any[] = []
      for (const value of prompt.content) {
        switch (value.type) {
          case "text":
            contents.push({
              type: "input_text",
              text: value.text,
            })
            break
          case "file": {
            if (value.mediaType !== "image/png")
              throw new NotImplementedException(`DEV - Unsupported media type: ${value.mediaType}`)
            const buf = Buffer.from(value.data)
            const base64 = buf.toString("base64")
            contents.push({
              type: "input_image",
              data: base64,
              mime_type: value.mediaType,
            })
            break
          }
          default:
            throw new NotImplementedException(`DEV - Unsupported type: ${value.type}`)
        }
      }
      return { role: prompt.role, content: contents }
    }
  }

  // Supported URL patterns for native file handling
  get supportedUrls() {
    return {
      "image/*": [/^https:\/\/example\.com\/images\/.*/],
    }
  }
  private convertPromptToResponsesInput(prompt: LanguageModelV3Prompt) {
    // @ts-expect-error
    return prompt.map((msg) => ({
      role: msg.role,
      content: msg.content.map((part) => {
        if (part.type === "text") {
          return {
            type: "input_text",
            text: part.text,
          }
        }

        if (part.type === "image") {
          return {
            type: "input_image",
            data: part.image.data.toString("base64"),
            mime_type: part.image.mimeType,
          }
        }

        throw new Error("Unsupported part type: " + part.type)
      }),
    }))
  }
  private promptToResponsesInput(prompt: {
    role: string
    content: string | LanguageModelV3Content[]
  }): string {
    if (typeof prompt.content === "string") {
      // if (prompt.role === "system") return prompt.content
      return `${prompt.role}: ${prompt.content}`
    } else {
      const value = prompt.content[0]
      if (
        value &&
        typeof value === "object" &&
        (value as any).type === "text" &&
        typeof (value as any).text === "string"
      ) {
        // @ts-expect-error
        return `${prompt.role}: ${value?.text}`
      }
    }
    return ""
  }

  private extractThoughtAndAnswer(raw: string) {
    const thoughtMatch = raw.match(/<unused\d+>thought([\s\S]*?)(?=<unused\d+>)/i)
    if (!thoughtMatch) return raw
    // @ts-expect-error
    const thought = thoughtMatch ? thoughtMatch[1].replace(/<unused\d+>/g, "").trim() : null
    let answer = raw.replace(/<unused\d+>thought[\s\S]*?(?=<unused\d+>)/gi, "")
    answer = answer.replace(/<unused\d+>/g, "").trim()
    return { thought, answer }
  }
}
