import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3FinishReason,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
  LanguageModelV3StreamResult,
  LanguageModelV3Usage,
  SharedV3Warning,
} from "@ai-sdk/provider"
import { NotImplementedException } from "@nestjs/common"
import { v4 } from "uuid"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { CallOrigin, extractThoughtAndAnswer } from "@/external/llm/ai-sdk-llm-provider-base"

class LanguageModelV3Prompt {}

export class CustomMedGemmaLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = "v3"
  readonly provider: string
  readonly modelId: string
  readonly baseUrl: string
  readonly apiKey: string

  constructor(baseUrl: string, config: LLMConfig, apiKey?: string) {
    this.baseUrl = new URL("v1", baseUrl).toString()
    this.apiKey = apiKey ?? "nothing"
    this.provider = "custom med-gemma"
    this.modelId = config.model.split(":")[0] ?? ""
  }

  get supportedUrls() {
    return {
      "image/*": [/^https:\/\/example\.com\/images\/.*/],
    }
  }

  async doGenerate(options: LanguageModelV3CallOptions): Promise<LanguageModelV3GenerateResult> {
    const callOrigin = options.providerOptions?.custom?.callOrigin
    if (!callOrigin)
      throw new NotImplementedException(
        "DEV - callOrigin is not specified in the options.providerOptions.custom",
      )
    switch (callOrigin) {
      case CallOrigin.generateStructuredOutput:
        return await this.doGenerateForGenerateStructuredOutput(options)
      case CallOrigin.processFiles:
        return await this.doGenerateForProcessFiles(options)
      default:
        throw new NotImplementedException(
          `DEV - doGenerate is not implemented for callOrigin = ${callOrigin}}`,
        )
    }
  }
  async doGenerateForGenerateStructuredOutput(
    options: LanguageModelV3CallOptions,
  ): Promise<LanguageModelV3GenerateResult> {
    const warnings: SharedV3Warning[] = []
    const input = await this.extractPromptContentsAsInput(options.prompt)

    const schema =
      options.responseFormat?.type === "json" ? options.responseFormat?.schema : undefined
    if (!schema)
      throw new NotImplementedException(
        "DEV - schema should be specified when calling generateStructuredOutput",
      )

    delete schema.$schema
    delete schema.additionalProperties

    const jsonFormat = {
      type: "json_schema",
      json_schema: {
        name: "OutputFormat",
        schema,
      },
    }

    const url = new URL("v1/chat/completions", this.baseUrl).toString()
    const body = {
      model: this.modelId,
      messages: input,
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stop: options.stopSequences,
      tools: undefined,
      ...(jsonFormat ? { response_format: jsonFormat } : undefined),
    }
    const stringifiedBody = JSON.stringify(body)

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        Connection: "close",
      },
      body: stringifiedBody,
    })
    const data: any = await res.json()

    const content: LanguageModelV3Content[] = []
    let usage: LanguageModelV3Usage = data.usage ?? null
    let finishReason: LanguageModelV3FinishReason

    if (data.choices && data.choices.length > 0) {
      finishReason = data.choices?.[0]?.finish_reason ?? null
      if (data.choices[0].message.content) {
        const { answer } = extractThoughtAndAnswer(data.choices[0].message.content)
        content.push({
          type: "text",
          text: answer
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .replace(/'''json/gi, "")
            .replace(/'''/g, "")
            .trim(),
        })
        usage = {
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
        }
      }
    } else {
      finishReason = { unified: "stop", raw: undefined }
      content.push({
        type: "text",
        text: "invalid output",
      })
    }

    return {
      content,
      finishReason,
      usage,
      request: { body: stringifiedBody },
      response: { body: data },
      warnings,
    }
  }

  async doGenerateForProcessFiles(
    options: LanguageModelV3CallOptions,
  ): Promise<LanguageModelV3GenerateResult> {
    const warnings: SharedV3Warning[] = []
    const input = await this.extractPromptContentsAsInput(options.prompt)

    const url = new URL("v1/chat/completions", this.baseUrl).toString()
    const body = {
      model: this.modelId,
      messages: input,
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stop: options.stopSequences,
      tools: undefined,
    }
    const stringifiedBody = JSON.stringify(body)

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        Connection: "close",
      },
      body: stringifiedBody,
    })
    // const raw = await res.text()
    // const data = JSON.parse(raw)
    const data: any = await res.json()

    const content: LanguageModelV3Content[] = []
    let usage: LanguageModelV3Usage = data.usage ?? null
    let finishReason: LanguageModelV3FinishReason

    if (data.choices && data.choices.length > 0) {
      finishReason = data.choices?.[0]?.finish_reason ?? null
      if (data.choices[0].message.content) {
        const { answer } = extractThoughtAndAnswer(data.choices[0].message.content)
        content.push({
          type: "text",
          text: answer,
        })
        usage = {
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
        }
      }
    } else {
      finishReason = { unified: "stop", raw: undefined }
      content.push({
        type: "text",
        text: "invalid output",
      })
    }

    return {
      content,
      finishReason,
      usage,
      request: { body: stringifiedBody },
      response: { body: data },
      warnings,
    }
  }

  async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
    const callOrigin = options.providerOptions?.custom?.callOrigin
    if (!callOrigin)
      throw new NotImplementedException(
        "DEV - callOrigin is not specified in the options.providerOptions.custom",
      )
    switch (callOrigin) {
      case CallOrigin.streamChatResponse:
        return await this.doStreamWithTools(options)
      default:
        throw new NotImplementedException(
          `DEV - doStream is not implemented for callOrigin = ${callOrigin}}`,
        )
    }
  }
  private convertToolsToDocs(tools: any) {
    if (!tools) return undefined
    return Object.entries(tools).map(
      ([name, tool]: any) =>
        `- ${name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters)}`,
    )
  }
  async doStreamWithTools(
    options: LanguageModelV3CallOptions,
  ): Promise<LanguageModelV3StreamResult> {
    const { prompt, tools, abortSignal } = options

    let appendToolsPrompt: string = ""
    if (tools && tools.length > 0) {
      // @ts-expect-error
      const toolDocs = this.convertToolsToDocs(tools).join("\n")

      appendToolsPrompt =
        `\n\nYou have access to the following tools:\n${toolDocs}\n` +
        `To call a tool, you MUST output valid JSON wrapped in XML tags exactly like this:\n` +
        `<tool_call>{"name": "toolName", "arguments": {"key": "value"}}</tool_call>\n\n`
    }
    const formattedMessages = await this.formatMessages(prompt, appendToolsPrompt)
    const url = new URL("v1/chat/completions", this.baseUrl).toString()
    const body = {
      model: this.modelId,
      messages: formattedMessages,
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stop: options.stopSequences,
      tools: undefined,
    }
    const stringifiedBody = JSON.stringify(body)
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        Connection: "close",
      },
      body: stringifiedBody,
      signal: abortSignal,
    })

    if (!response.ok || !response.body) {
      throw new Error(`vLLM request failed: ${response.statusText}`)
    }

    const stream = response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new SSEParserStream()) // Extracts text from vLLM's Server-Sent Events
      .pipeThrough(new MedGemmaToolParserStream()) // Extracts <tool_call> and yields SDK Tool parts

    return {
      stream,
    }
  }

  private async formatMessages(prompt: any[], appendToolsPrompt: string) {
    const messagesFromPrompt = await this.extractPromptContentsAsInput(prompt)

    const messages: any[] = []
    for (const msg of messagesFromPrompt) {
      if (msg.role === "system") {
        messages.push({ role: "system", content: msg.content + appendToolsPrompt })
      } else if (msg.role === "tool") {
        const resultsText = (msg.content as Array<any>)
          .map(
            (c: any) =>
              `<tool_result name="${c.toolName}">${JSON.stringify(c.result)}</tool_result>`,
          )
          .join("\n")
        messages.push({ role: "user", content: resultsText })
      } else {
        let content = ""
        if (Array.isArray(msg.content)) {
          content = msg.content.map((c: any) => c.text || "").join("")
        } else {
          content = msg.content || ""
        }
        messages.push({ role: msg.role, content })
      }
    }
    return messages
  }

  private async extractPromptContentsAsInput(prompt: LanguageModelV3Prompt) {
    return await Promise.all(
      (prompt as Array<{ role: string; content: string | LanguageModelV3Content[] }>).map((p) =>
        this.toInput(p),
      ),
    )
  }
  private async toInput(prompt: { role: string; content: string | LanguageModelV3Content[] }) {
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
            if (!value.mediaType.startsWith("image/"))
              throw new NotImplementedException(`DEV - Unsupported media type: ${value.mediaType}`)
            const buf = Buffer.from(value.data)
            // const resizedBuffer = await sharp(buf)
            //   .resize({ width: 100, height: 100, fit: "inside", withoutEnlargement: true })
            //   .jpeg({ quality: 60 })
            //   .toBuffer()
            // const base64 = resizedBuffer.toString("base64")
            const base64 = buf.toString("base64")
            contents.push({
              type: "image_url",
              image_url: {
                // url: `data:${value.mediaType};base64,${base64}`,
                url: `data:image/jpeg;base64,${base64}`,
              },
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
}
class MedGemmaToolParserStream extends TransformStream<string, LanguageModelV3StreamPart> {
  constructor() {
    let buffer = ""
    let isToolCallOpen = false

    super({
      transform(chunk, controller) {
        buffer += chunk

        if (!isToolCallOpen) {
          const startTagIndex = buffer.indexOf("<tool_call>")

          if (startTagIndex !== -1) {
            // Emit any text that came BEFORE the tool call
            const textBefore = buffer.slice(0, startTagIndex)
            if (textBefore.trim()) {
              controller.enqueue({ type: "text-delta", delta: textBefore, id: "" })
            }

            // Switch state to 'parsing tool call'
            isToolCallOpen = true
            buffer = buffer.slice(startTagIndex)
          } else {
            // Hold back text if it looks like the start of `<tool_call>`
            const possibleTagStart = buffer.lastIndexOf("<")
            if (
              possibleTagStart !== -1 &&
              "<tool_call>".startsWith(buffer.slice(possibleTagStart))
            ) {
              if (possibleTagStart > 0) {
                controller.enqueue({
                  type: "text-delta",
                  delta: buffer.slice(0, possibleTagStart),
                  id: v4(),
                })
                buffer = buffer.slice(possibleTagStart)
              }
            } else {
              // Safe to emit the whole buffer as normal text
              controller.enqueue({ type: "text-delta", delta: buffer, id: v4() })
              buffer = ""
            }
          }
        }

        // If we are currently buffering a tool call
        if (isToolCallOpen) {
          const endTagIndex = buffer.indexOf("</tool_call>")
          if (endTagIndex !== -1) {
            const jsonStr = buffer.slice("<tool_call>".length, endTagIndex)

            try {
              const toolData = JSON.parse(jsonStr)
              controller.enqueue({
                type: "tool-call",
                toolCallId: `call_${v4()}`,
                toolName: toolData.name,
                input: JSON.parse(toolData.arguments),
              })
            } catch (_err) {
              console.error("Failed to parse MedGemma tool call JSON:", jsonStr)
              // Fallback: emit as text if parsing fails
              controller.enqueue({
                type: "text-delta",
                delta: buffer.slice(0, endTagIndex + "</tool_call>".length),
                id: v4(),
              })
            }

            // Reset state and continue parsing
            isToolCallOpen = false
            buffer = buffer.slice(endTagIndex + "</tool_call>".length)
          }
        }
      },
      flush(controller) {
        if (buffer) {
          controller.enqueue({ type: "text-delta", delta: buffer, id: v4() })
        }
        controller.enqueue({
          type: "finish",
          finishReason: { unified: "stop", raw: undefined },
          usage: {
            inputTokens: {
              total: NaN,
              noCache: NaN,
              cacheRead: NaN,
              cacheWrite: NaN,
            },
            outputTokens: {
              total: NaN,
              text: NaN,
              reasoning: NaN,
            },
          },
        })
      },
    })
  }
}

class SSEParserStream extends TransformStream<string, string> {
  constructor() {
    let buffer = ""
    super({
      transform(chunk, controller) {
        buffer += chunk
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6))
              const text = data.choices?.[0]?.delta?.content
              if (text) controller.enqueue(text)
            } catch (_e) {
              // ignore parse errors for incomplete SSE lines
            }
          }
        }
      },
    })
  }
}
