import { AgentModel } from "@caseai-connect/api-contracts"
import { afterAll, beforeAll } from "@jest/globals"
import { v4 } from "uuid"
import { z } from "zod"
import type {
  LLMChatMessage,
  LLMConfig,
  LLMFile,
  LLMMetadata,
} from "@/common/interfaces/llm-provider.interface"
import { sdk } from "@/external/llm/open-telemetry-init"
import { AISDKMockProvider } from "@/external/llm/providers/ai-sdk-mock.provider"

describe.skip("AISDKMockProvider", () => {
  let provider: AISDKMockProvider
  let messages: LLMChatMessage[]
  let config: LLMConfig
  let metadata: LLMMetadata
  beforeAll(async () => {
    provider = new AISDKMockProvider()
    messages = [{ role: "user", content: "for test purpose" }]
    metadata = {
      agentId: "agentId",
      agentSessionId: "agentSessionId",
      currentTurn: 0,
      organizationId: "organizationId",
      projectId: "projectId",
      tags: ["**TEST**"],
      traceId: "traceId",
    }
  })
  afterAll(async () => {
    await sdk.shutdown()
  })
  it("streamChatResponse - default mock value", async () => {
    metadata.traceId = v4()
    config = { model: AgentModel._MockStreamChatResponse, temperature: 1, systemPrompt: "" }
    const stream = provider.streamChatResponse({ messages, config, metadata })
    const results = await streamToStringArray(stream)
    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThan(0)
    expect(results.join("")).toBe("Hello, I'm the streamChatResponse default mock!")
  })
  it("streamChatResponse - custom mock value", async () => {
    metadata.traceId = v4()
    config = {
      model: AgentModel._MockStreamChatResponse,
      temperature: 1,
      systemPrompt: "",
      mockResult: ["This te", "xt is from my", " custom streamChatResponse Mock!"],
    }
    const stream = provider.streamChatResponse({ messages, config, metadata })
    const results = await streamToStringArray(stream)
    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThan(0)
    expect(results.join("")).toBe("This text is from my custom streamChatResponse Mock!")
  })
  it("generateText - default mock value", async () => {
    metadata.traceId = v4()
    const prompt = ""
    config = { model: AgentModel._MockGenerateText, temperature: 1, systemPrompt: "" }
    const result = await provider.generateText({ prompt, config, metadata })
    expect(result).toBeDefined()
    expect(result).toBe("Hello, I'm the generateText default mock response!")
  })
  it("generateText - custom mock value", async () => {
    metadata.traceId = v4()
    const prompt = ""
    config = {
      model: AgentModel._MockGenerateText,
      temperature: 1,
      systemPrompt: "",
      mockResult: "This text is from my custom generateText Mock!",
    }
    const result = await provider.generateText({ prompt, config, metadata })
    expect(result).toBeDefined()
    expect(result).toBe("This text is from my custom generateText Mock!")
  })
  it("generateObject - default mock value", async () => {
    metadata.traceId = v4()
    const prompt = ""
    const schema = z.object({ content: z.string(), source: z.string() })
    config = { model: AgentModel._MockGenerateObject, temperature: 1, systemPrompt: "" }
    const result = await provider.generateObject({ schema, prompt, config, metadata })
    expect(result).toBeDefined()
    expect(() => schema.parse(result)).not.toThrow()
    const parsed = schema.parse(result)
    expect(parsed.source).toBe("MOCK")
    expect(parsed.content).toBe("Hello, I'm the generateObject default mock response!")
  })
  it("generateObject - custom mock value", async () => {
    metadata.traceId = v4()
    const prompt = ""
    const schema = z.object({ content: z.string(), source: z.string() })
    const mock: z.infer<typeof schema> = {
      content: "This object is from my custom generateObject Mock!",
      source: "MOCK",
    }
    config = {
      model: AgentModel._MockGenerateObject,
      temperature: 1,
      systemPrompt: "",
      mockResult: JSON.stringify(mock),
    }
    const result = await provider.generateObject({ schema, prompt, config, metadata })
    expect(result).toBeDefined()
    expect(() => schema.parse(result)).not.toThrow()
    const parsed = schema.parse(result)
    expect(parsed.source).toBe("MOCK")
    expect(parsed.content).toBe("This object is from my custom generateObject Mock!")
  })
  it("processFiles - default mock value", async () => {
    metadata.traceId = v4()
    const prompt = ""
    const files: LLMFile[] = [
      {
        name: "file1.pdf",
        mediaType: "application/pdf",
        content: Buffer.from("%PDF-1.4\n%%EOF"),
      },
      {
        name: "image.png",
        mediaType: "image/png",
        content: Buffer.from([0x89, 0x50, 0x4e, 0x47]), // header PNG
      },
    ]
    config = { model: AgentModel._MockProcessFiles, temperature: 1, systemPrompt: "" }
    const result = await provider.processFiles({ prompt, files, config, metadata })
    expect(result).toBeDefined()
    expect(result).toBe("Hello, I'm the processFiles default mock response!")
  })
  it("processFiles - custom mock value", async () => {
    metadata.traceId = v4()
    const prompt = ""
    const files: LLMFile[] = [
      {
        name: "file1.pdf",
        mediaType: "application/pdf",
        content: Buffer.from("%PDF-1.4\n%%EOF"),
      },
      {
        name: "image.png",
        mediaType: "image/png",
        content: Buffer.from([0x89, 0x50, 0x4e, 0x47]), // header PNG
      },
    ]
    config = {
      model: AgentModel._MockProcessFiles,
      temperature: 1,
      systemPrompt: "",
      mockResult: "This text is from my custom processFiles Mock!",
    }
    const result = await provider.processFiles({ prompt, files, config, metadata })
    expect(result).toBeDefined()
    expect(result).toBe("This text is from my custom processFiles Mock!")
  })

  async function streamToStringArray(
    stream: AsyncGenerator<string, void, unknown>,
  ): Promise<string[]> {
    const values: string[] = []
    for await (const chunk of stream) {
      values.push(chunk)
    }
    return values
  }
})
