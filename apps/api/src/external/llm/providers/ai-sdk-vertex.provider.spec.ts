import { AgentModel } from "@caseai-connect/api-contracts"
import { afterAll, beforeAll } from "@jest/globals"
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
import { config as dotenvConfig } from "dotenv"
import { LangfuseIntegrationExporter } from "@/external/langfuse/langfuse-integration-exporter"
import { AgentModelToAgentProvider, AgentProvider } from "@/external/llm/agent-provider"
import { sdk } from "@/external/llm/open-telemetry-init"
import { AISDKVertexProvider } from "@/external/llm/providers/ai-sdk-vertex.provider"
import { ProviderSpecs } from "@/external/llm/providers/provider-specs"
import { gcpCredentialsCheck } from "@/external/llm/providers/spec-gcp-tools"

dotenvConfig({ path: ".env", override: true })
dotenvConfig({ path: ".env.test", override: true })
const testModels = Object.values(AgentModel).filter(
  (am) => AgentModelToAgentProvider[am] === AgentProvider.Vertex,
)

if (process.env.IS_TEST === "true" && process.env.VERTEX_TEST === "true") {
  describe("AISDKVertexProvider", () => {
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
    let provider: AISDKVertexProvider
    beforeAll(async () => {
      const conf = process.env.GOOGLE_APPLICATION_CREDENTIALS
      if (!conf) return
      provider = new AISDKVertexProvider()
      traceProvider.register()
    })
    afterAll(async () => {
      await langfuse.forceFlush()
      await traceProvider.forceFlush()
      await traceProvider.shutdown()
      await sdk.shutdown()
    })
    it("gcpCredentialsCheck", async () => {
      const check = await gcpCredentialsCheck()
      expect(check).toBeTruthy()
    })

    it.each(testModels)("generateText - %s", async (model) => {
      await ProviderSpecs.testGenerateText({ provider, model })
    })

    it.each(testModels)("generateObject - %s", async (model) => {
      await ProviderSpecs.testGenerateObject({ provider, model })
    })

    it.each(testModels)("generateStructuredOutput -pdf - %s", async (model) => {
      await ProviderSpecs.testGenerateStructuredOutputFromPdf({ provider, model })
    })

    it.each(testModels)("generateStructuredOutput -jpg - %s", async (model) => {
      await ProviderSpecs.testGenerateStructuredOutputFromMathematicalJpg({ provider, model })
    })

    it.each(testModels)("generateStructuredOutput -png - %s", async (model) => {
      await ProviderSpecs.testGenerateStructuredOutputFromXRayPng_FR({ provider, model })
    })

    it.each(testModels)("generateStructuredOutput -png (low res) - %s", async (model) => {
      await ProviderSpecs.testGenerateStructuredOutputFromXRayLowPng_FR({ provider, model })
    })

    it.each(testModels)("streamChatResponse - %s", async (model) => {
      await ProviderSpecs.testStreamChatResponse({ provider, model })
    })

    it.each(testModels)("streamChatResponse with tools - %s", async (model) => {
      await ProviderSpecs.testStreamChatResponseWithTools({
        provider,
        model,
        advancedExpectation: true,
      })
    })
  })
} else {
  describe.skip("AISDKVertexProvider", () => {
    it("skipped (requires process.env.IS_TEST=true and process.env.VERTEX_TEST=true)", () => {})
  })
}
