import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3FinishReason,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamResult,
  LanguageModelV3Usage,
  SharedV3Warning,
} from "@ai-sdk/provider"
import { NotImplementedException } from "@nestjs/common"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { CallOrigin, extractThoughtAndAnswer } from "@/external/llm/ai-sdk-llm-provider-base"

class LanguageModelV3Prompt {}

export class CustomMedGemmaLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = "v3"
  readonly provider: string
  readonly modelId: string
  readonly baseUrl: string
  readonly apiKey: string

  constructor({ baseUrl, config, apiKey }: { baseUrl: string; config: LLMConfig; apiKey: string }) {
    this.baseUrl = new URL("v1", baseUrl).toString()
    this.apiKey = apiKey
    this.provider = "Custom Medgemma"
    this.modelId = config.model.split(":")[0] ?? ""
  }

  //required for LanguageModelV3 implementation
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
    // biome-ignore lint/suspicious/noExplicitAny: external
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
      // biome-ignore lint/suspicious/noExplicitAny: custom
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
            // fixme DOO: reduce file size ?
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

  async doStream(options: LanguageModelV3CallOptions): Promise<LanguageModelV3StreamResult> {
    const callOrigin = options.providerOptions?.custom?.callOrigin
    if (!callOrigin)
      throw new NotImplementedException(
        "DEV - callOrigin is not specified in the options.providerOptions.custom",
      )
    switch (callOrigin) {
      case CallOrigin.streamChatResponse_withTools:
        return await this.doStreamWithTools(options)
      default:
        throw new NotImplementedException(
          `DEV - doStream is not implemented for callOrigin = ${callOrigin}}`,
        )
    }
  }

  async doStreamWithTools(
    options: LanguageModelV3CallOptions,
  ): Promise<LanguageModelV3StreamResult> {
    throw new NotImplementedException(`DEV - doStreamWithTools is not (yet) implemented`)
  }
}
