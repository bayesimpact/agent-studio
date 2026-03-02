import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { tool } from "@ai-sdk/provider-utils"
import { AgentModel } from "@caseai-connect/api-contracts"
import { afterAll, beforeAll } from "@jest/globals"
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
import type { ToolSet } from "ai"
import { config as dotenvConfig } from "dotenv"
import { v4 } from "uuid"
import { z } from "zod"
import type {
  LLMChatMessage,
  LLMConfig,
  LLMFile,
  LLMMetadata,
} from "@/common/interfaces/llm-provider.interface"
import { LangfuseIntegrationExporter } from "@/external/langfuse/langfuse-integration-exporter"
import { sdk } from "@/external/llm/open-telemetry-init"
import { AISDKMedGemmaV2Provider } from "@/external/llm/providers/ai-sdk-med-gemma-v2.provider"
import { gcpCredentialsCheck } from "@/external/llm/providers/spec-gcp-tools"
import { expectIncludes, includesInsensitive } from "@/external/llm/providers/spec-tools"

dotenvConfig({ path: ".env", override: true })
dotenvConfig({ path: ".env.test", override: true })
const model = AgentModel.MedGemma15_4B_LanguageModelV2.split(":")[0] as string

if (process.env.IS_TEST === "true" && process.env.MEDGEMMA_TEST === "true") {
  describe("AISDKMedGemmaProvider - ai-sdk/provider/LanguageModelV2", () => {
    jest.setTimeout(60_000)
    const langfuse = new LangfuseIntegrationExporter({
      secretKey: process.env.LANGFUSE_SK,
      publicKey: process.env.LANGFUSE_PK,
      baseUrl: process.env.LANGFUSE_BASE_URL,
    })
    const traceProvider = new NodeTracerProvider({
      spanProcessors: [
        new BatchSpanProcessor(new ConsoleSpanExporter()),
        new BatchSpanProcessor(langfuse),
      ],
    })
    let provider: AISDKMedGemmaV2Provider
    let messages: LLMChatMessage[]
    let config: LLMConfig
    let metadata: LLMMetadata
    const systemPrompt =
      "You're a chat bot named Elvis. Answer as simply and directly as possible. If you don't know the response or are not sure, just say 'Sorry, I'm only the King'"
    beforeAll(async () => {
      const conf = process.env.GOOGLE_APPLICATION_CREDENTIALS
      if (!conf) return
      provider = new AISDKMedGemmaV2Provider()
      messages = []
      metadata = {
        agentId: "agentId",
        agentSessionId: "agentSessionId",
        currentTurn: 0,
        organizationId: "organizationId",
        projectId: "projectId",
        tags: ["**TEST**"],
        traceId: "<to be set in test>",
      }
      traceProvider.register()
    })
    afterAll(async () => {
      await langfuse.forceFlush()
      await traceProvider.forceFlush()
      await traceProvider.shutdown()
      await sdk.shutdown()
    })
    xit("gcpCredentialsCheck", async () => {
      const check = await gcpCredentialsCheck()
      expect(check).toBeTruthy()
    })

    it("generateText", async () => {
      metadata.traceId = v4()
      const prompt = "What's your name? answer only your name"
      config = { model, temperature: 0, systemPrompt }
      const result = await provider.generateText({ prompt, config, metadata })
      expect(result).toBeDefined()
      expect(result).toBe("Elvis")
    })

    it("generateObject", async () => {
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
    it("generateStructuredOutput -pdf", async () => {
      metadata.traceId = v4()
      const schema = z.object({ adresse: z.string(), telephone: z.string(), courriel: z.string() })
      const pdfBuffer = await readFile(join(__dirname, `files`, `test-pdf.pdf`))
      const testFile: LLMFile = {
        type: "file",
        name: "file1.pdf",
        mediaType: "application/pdf",
        content: Buffer.from("%PDF-1.4\n%%EOF"),
      }
      const message: LLMChatMessage = {
        role: "user",
        content: [
          {
            type: "text",
            text: "extrait les valeurs du tableau et remplace le numero de telephone par 007",
          },
          {
            type: testFile.type as "file",
            filename: "test-pdf.pdf",
            mediaType: "application/pdf",
            data: pdfBuffer,
          },
        ],
      }
      config = { model, temperature: 0, systemPrompt }
      const result = await provider.generateStructuredOutput({
        message,
        schema: schema.toJSONSchema(),
        config,
        metadata,
      })
      expect(result).toBeDefined()
      expect(() => schema.parse(result)).not.toThrow()
      const parsed = schema.parse(result)
      expectIncludes(parsed.adresse, "dreux")
      expect(parsed.telephone.toLowerCase()).toBe("007")
      expect(parsed.courriel.toLowerCase()).toBe("jdoudou@laposte.net")
    })

    it("generateStructuredOutput -jpg", async () => {
      metadata.traceId = v4()
      const schema = z.array(z.object({ constant: z.string(), value: z.number() }))
      const jpgBuffer = await readFile(join(__dirname, `files`, "test-jpg.jpg"))
      const testFile: LLMFile = {
        type: "file",
        name: "test-jpg.jpg",
        mediaType: "image/jpeg",
        content: jpgBuffer,
      }
      const message: LLMChatMessage = {
        role: "user",
        content: [
          {
            type: "text",
            text: "extrait les valeurs du tableau et renvoie les en remplacant la valeur de pi par 0.007",
          },
          {
            type: testFile.type as "file",
            filename: testFile.name,
            mediaType: testFile.mediaType,
            data: testFile.content,
          },
        ],
      }
      config = { model, temperature: 0, systemPrompt }
      const result = await provider.generateStructuredOutput({
        message,
        schema: schema.toJSONSchema(),
        config,
        metadata,
      })
      expect(result).toBeDefined()
      expect(() => schema.parse(result)).not.toThrow()
      const parsed = schema.parse(result)
      expect(parsed.length).toBe(8)
      const catalan = parsed.filter((c) => includesInsensitive(c.constant, "catalan"))
      expect(catalan.length).toBe(1)
      expect(catalan[0]?.value).toBe(0.9159655941)
      const pi = parsed.filter((c) => includesInsensitive(c.constant, "pi"))
      expect(pi.length).toBe(1)
      expect(pi[0]?.value).toBe(0.007)
    })

    it("generateStructuredOutput -png", async () => {
      metadata.traceId = v4()
      const schema = z.object({ title: z.string(), description: z.string() })
      const pngBuffer = await readFile(join(__dirname, `files`, "xray-png.png"))
      const testFile: LLMFile = {
        type: "file",
        name: "xray-png.png",
        mediaType: "image/png",
        content: pngBuffer,
      }
      const message: LLMChatMessage = {
        role: "user",
        content: [
          {
            type: "text",
            text: "give this image a title and a short description (2 or 3 sentences)",
          },
          {
            type: testFile.type as "file",
            filename: testFile.name,
            mediaType: testFile.mediaType,
            data: testFile.content,
          },
        ],
      }
      config = { model, temperature: 0, systemPrompt }
      const result = await provider.generateStructuredOutput({
        message,
        schema: schema.toJSONSchema(),
        config,
        metadata,
      })
      expect(result).toBeDefined()
      expect(() => schema.parse(result)).not.toThrow()
      const parsed = schema.parse(result)
      expect(parsed).toBeDefined()
      expectIncludes(parsed.title, "ray")
      expectIncludes(parsed.description, "pleural")
    })

    it("processFiles", async () => {
      metadata.traceId = v4()
      const prompt = "About the file in attachment, give a short description (2 or 3 sentences)."

      const pngBuffer = await readFile(join(__dirname, `files`, "xray-png.png"))
      const testFile: LLMFile = {
        type: "file",
        name: "xray-png.png",
        mediaType: "image/png",
        content: pngBuffer,
      }

      const files: LLMFile[] = [testFile]
      config = { model, temperature: 0, systemPrompt }
      const result = await provider.processFiles({ prompt, files, config, metadata })
      expect(result).toBeDefined()
      expectIncludes(result, "math")
    })

    it("streamChatResponse", async () => {
      metadata.traceId = v4()
      config = { model, temperature: 0, systemPrompt }
      messages = [{ role: "user", content: "What can you do for me?" }]
      const stream = provider.streamChatResponse({ messages, config, metadata })
      const results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expectIncludes(results.join(""), "answer")
    })

    it("streamChatResponse with tools", async () => {
      const prompt = `Today's date: 10/03/2026
##Instructions:
Your main task is to help the user fill out the form by asking questions and providing guidance. 
Ask one question at a time to fill out the form.
Here are the form fields to fill:

    happy: Is happy?
    hourOfSleep: How many sleep hours per day?
    weight: weight in kilogrammes (rounded .5)?

##Tools:
You should use "fillForm" tool to fill out the form, reach time you got a response that can be used to fill the form. 
Call "fillForm" each times you have a new information or an updated one: pass undefined for fields that are not filled yet. 
You can also update previously filled information if the user changes their answer. 
After getting response from the tool "fillForm", continue asking the user until the status is "completed".
If the status is "completed" just send a message to the user that indicates that the form has been completed.
Response language: Always answer in English.`
      const inputSchema = z.object({
        happy: z.boolean().describe("Is happy?").nullable(),
        hourOfSleep: z.int().describe("How many sleep hours per day?").nullable(),
        weight: z.number().describe("weight in kilogrammes (rounded .5)?").nullable(),
      })
      // biome-ignore lint/correctness/noUnusedVariables: used in lambda
      let outputForm: Record<string, boolean | string | number | null> = {}
      let status: string = "NOT_STARTED"
      const fillFormTool = tool({
        description: "Fill out a form. Get the values from user's answers.",
        inputSchema,
        outputSchema: z.object({
          status: z
            .enum(["completed", "in_progress"])
            .describe("Whether the form is completed or not"),
          formState: inputSchema.describe(
            "The current state of the form, with values filled by the user",
          ),
        }),
        execute: async (input, _options) => {
          outputForm = input
          status =
            input.happy !== undefined && (input.hourOfSleep ?? 0) > 0 && (input.weight ?? 0) > 0
              ? "completed"
              : "in_progress"
          console.debug(status)
          return {
            status,
            formState: input,
          }
        },
      })
      metadata.traceId = v4()
      config = {
        model,
        temperature: 0,
        systemPrompt: prompt,
        tools: { fillForm: fillFormTool } as ToolSet,
      }
      const chatMessages: LLMChatMessage[] = [{ role: "user", content: "Bonjour" }]
      metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
      let stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
      let results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      console.log(JSON.stringify(results))
      expect(results.length).toBeGreaterThan(0)
      expect(status).not.toEqual("completed")
      expect(!outputForm.happy).toBeTruthy()
      expect(!outputForm.hourOfSleep).toBeTruthy()
      expect(!outputForm.weight).toBeTruthy()

      chatMessages.push({ role: "assistant", content: results.join("") })
      chatMessages.push({ role: "user", content: "I'm happy" })
      metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
      stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
      results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(status).not.toEqual("completed")
      expect(outputForm.happy).toEqual(true)
      expect(!outputForm.hourOfSleep).toBeTruthy()
      expect(!outputForm.weight).toBeTruthy()

      chatMessages.push({ role: "assistant", content: results.join("") })
      chatMessages.push({ role: "user", content: "I sleep about 7 hours a night" })
      metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
      stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
      results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(status).not.toEqual("completed")
      expect(outputForm.happy).toEqual(true)
      expect(outputForm.hourOfSleep).toEqual(7)
      expect(!outputForm.weight).toBeTruthy()

      chatMessages.push({ role: "assistant", content: results.join("") })
      chatMessages.push({ role: "user", content: "I do not smoke" })
      metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
      stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
      results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(status).not.toEqual("completed")
      expect(outputForm.happy).toEqual(true)
      expect(outputForm.hourOfSleep).toEqual(7)
      expect(!outputForm.weight).toBeTruthy()

      chatMessages.push({ role: "assistant", content: results.join("") })
      chatMessages.push({ role: "user", content: "99.4 kg" })
      metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
      stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
      results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(status).toEqual("completed")
      expect(outputForm.happy).toEqual(true)
      expect(outputForm.hourOfSleep).toEqual(7)
      expect(outputForm.weight).toBeGreaterThan(99)
      expect(outputForm.weight).toBeLessThan(100)
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
  describe.skip("AISDKMedGemmaProvider - ai-sdk/provider/LanguageModelV2", () => {
    it("skipped (requires process.env.IS_TEST=true and process.env.MEDGEMMA_TEST=true)", () => {})
  })
}
