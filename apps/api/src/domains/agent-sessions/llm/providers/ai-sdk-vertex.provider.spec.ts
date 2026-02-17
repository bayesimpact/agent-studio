// biome-ignore assist/source/organizeImports: open-telemetry-init should be in first
import "../open-telemetry-init.ts" // !!!! first import !!!!
import { AgentModel } from "@caseai-connect/api-contracts"
import { afterAll, beforeAll } from "@jest/globals"
import { config as dotenvConfig } from "dotenv"
import { readFile } from "node:fs/promises"
import { GoogleAuth } from "google-auth-library"
import { join } from "path"
import { z } from "zod"
import type {
  LLMChatMessage,
  LLMConfig,
  LLMFile,
  LLMMetadata,
} from "@/common/interfaces/llm-provider.interface"
import {
  AgentModelToAgentProvider,
  AgentProvider,
} from "@/domains/agent-sessions/llm/agent-provider"
import { AISDKVertexProvider } from "@/domains/agent-sessions/llm/providers/ai-sdk-vertex.provider"
import { v4 } from "uuid"
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
import { LangfuseIntegrationExporter } from "@/external/langfuse/langfuse-integration-exporter"

dotenvConfig({ path: ".env.test", override: true })
// process.env.LANGFUSE_DISABLE_AUTO_DETECTION = "true"
const testModels = Object.values(AgentModel).filter(
  (am) => AgentModelToAgentProvider[am] === AgentProvider.Vertex,
)

if (process.env.IS_TEST === "true" && process.env.AIENGINE_TEST === "true") {
  describe.skip("AISDKVertexProvider", () => {
    jest.setTimeout(20_000)
    const traceProvider = new NodeTracerProvider({
      spanProcessors: [
        new BatchSpanProcessor(new ConsoleSpanExporter()),
        new BatchSpanProcessor(
          new LangfuseIntegrationExporter({
            secretKey: process.env.LANGFUSE_SK,
            publicKey: process.env.LANGFUSE_PK,
            baseUrl: process.env.LANGFUSE_BASE_URL,
          }),
        ),
      ],
    })
    let provider: AISDKVertexProvider
    let messages: LLMChatMessage[]
    let config: LLMConfig
    let metadata: LLMMetadata
    const systemPrompt =
      "You're a chat bot named Elvis. Answer as simply and directly as possible. If you don't know the response or are not sure, just say 'Sorry, I'm only the King'"
    beforeAll(async () => {
      const conf = process.env.GOOGLE_APPLICATION_CREDENTIALS
      if (!conf) return
      provider = new AISDKVertexProvider()
      messages = []
      metadata = {
        agentId: "agentId",
        agentSessionId: "agentSessionId",
        currentTurn: 0,
        organizationId: "organizationId",
        projectId: "projectId",
        tags: ["**TEST**"],
        traceId: "to be set",
      }
      traceProvider.register()
    })
    afterAll(async () => {
      await traceProvider.forceFlush()
      await traceProvider.shutdown()
    })

    it.each(testModels)("streamChatResponse - %s", async (model) => {
      if (!(await vertexCheck())) return
      metadata.traceId = v4()
      config = { model, temperature: 0, systemPrompt }
      messages = [{ role: "user", content: "Are you a human?" }]
      const stream = provider.streamChatResponse({ messages, config, metadata })
      const results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(results.join("").toLowerCase().includes("no")).toBeTruthy()
      await traceProvider.forceFlush()
    })

    it.each(testModels)("generateText - %s", async (model) => {
      if (!(await vertexCheck())) return
      metadata.traceId = v4()
      const prompt = "What's your name? answer only your name"
      config = { model, temperature: 0, systemPrompt }
      const result = await provider.generateText({ prompt, config, metadata })
      expect(result).toBeDefined()
      expect(result).toBe("Elvis")
    })

    it.each(testModels)("generateObject - %s", async (model) => {
      if (!(await vertexCheck())) return
      metadata.traceId = v4()
      const prompt =
        "Give me the more popular song of Elvis with Love in his title. Return also the year of the song."
      const schema = z.object({ song: z.string(), year: z.string() })
      config = { model, temperature: 0, systemPrompt }
      const result = await provider.generateObject({ schema, prompt, config, metadata })
      expect(result).toBeDefined()
      expect(() => schema.parse(result)).not.toThrow()
      const parsed = schema.parse(result)
      expect(parsed.song).toBe("Can't Help Falling in Love")
      expect(parsed.year).toBe("1961")
    })

    it.each(testModels)("processFiles - %s", async (model) => {
      if (!(await vertexCheck())) return
      metadata.traceId = v4()
      const prompt = "How many files in attachment?"

      const pdfBuffer = await readFile(join(__dirname, `files`, `test-pdf.pdf`))
      const jpgBuffer = await readFile(join(__dirname, `files`, `test-jpg.jpg`))

      const files: LLMFile[] = [
        {
          name: "test-pdf.pdf",
          mediaType: "application/pdf",
          content: pdfBuffer,
        },
        {
          name: "test-jpg.jpg",
          mediaType: "image/png",
          content: jpgBuffer,
        },
      ]
      config = { model, temperature: 0, systemPrompt }
      const result = await provider.processFiles({ prompt, files, config, metadata })
      expect(result).toBeDefined()
      expect(result.includes("2") || result.toLowerCase().includes("two")).toBeTruthy()
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
} else {
  describe.skip("AISDKVertexProvider", () => {
    it("skipped", () => {})
  })
}

const vertexCheck = async (): Promise<boolean> => {
  let check: boolean = false
  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    })
    const client = await auth.getClient()
    const token = await client.getAccessToken()
    check = !!token
  } catch (err) {
    console.error("AUTH ERROR:", JSON.stringify(err))
  }
  return check
}
