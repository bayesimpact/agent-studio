import { createVertex } from "@ai-sdk/google-vertex"
import { generateText } from "ai"
import { Langfuse } from "langfuse"

describe("AI SDK with Google Gemini and Langfuse", () => {
  let langfuse: Langfuse
  let vertex: ReturnType<typeof createVertex>

  beforeAll(async () => {
    // Create Vertex provider with project and location from environment
    vertex = createVertex({
      project: process.env.GCP_PROJECT || process.env.GOOGLE_VERTEX_PROJECT || "caseai-connect",
      location: process.env.LOCATION || process.env.GOOGLE_VERTEX_LOCATION || "europe-west1",
    })

    const secretKey = process.env.LANGFUSE_SK ?? process.env.LANGFUSE_SECRET_KEY
    const publicKey = process.env.LANGFUSE_PK ?? process.env.LANGFUSE_PUBLIC_KEY
    const baseUrl = process.env.LANGFUSE_BASE_URL

    const missingEnvVars: string[] = []
    if (!secretKey) missingEnvVars.push("LANGFUSE_SK (or LANGFUSE_SECRET_KEY)")
    if (!publicKey) missingEnvVars.push("LANGFUSE_PK (or LANGFUSE_PUBLIC_KEY)")
    if (!baseUrl) missingEnvVars.push("LANGFUSE_BASE_URL")

    if (missingEnvVars.length > 0) {
      throw new Error(
        `Missing Langfuse settings for ai-sdk test: ${missingEnvVars.join(", ")}. ` +
          "Set them in your environment before running this spec.",
      )
    }

    langfuse = new Langfuse({
      secretKey,
      publicKey,
      baseUrl,
    })
  })

  afterAll(async () => {
    await langfuse.flushAsync()
    await langfuse.shutdownAsync()
  })

  it("should generate text using Google Gemini via ai-sdk and trace it with Langfuse", async () => {
    const question = "What is the capital of France? Answer in one sentence."

    // Create a Langfuse trace for this test
    // Note: This approach works with Langfuse v2 (no OTLP endpoint required)
    const trace = langfuse.trace({
      name: "ai-sdk-test",
      metadata: {
        test: "ai-sdk-gemini-integration",
        question,
      },
    })

    // Generate text using ai-sdk with Google Gemini Vertex AI
    // Link it to the Langfuse trace via langfuseTraceId in metadata
    const result = await generateText({
      model: vertex("gemini-2.5-flash"),
      prompt: question,
      experimental_telemetry: {
        isEnabled: true,
        functionId: "test-gemini-generation",
        metadata: {
          langfuseTraceId: trace.id,
          testName: "ai-sdk-gemini-test",
        },
      },
    })

    // Verify we got a response
    expect(result.text).toBeDefined()
    expect(result.text.length).toBeGreaterThan(0)
    expect(result.text.toLowerCase()).toContain("paris")

    // Update the trace with the result
    trace.update({
      output: result.text,
      metadata: {
        test: "ai-sdk-gemini-integration",
        question,
        responseLength: result.text.length,
        usage: result.usage,
      },
    })

    // Flush to ensure data is sent to Langfuse
    await langfuse.flushAsync()

    // Basic assertions
    expect(result.usage).toBeDefined()
    console.log("Generated text:", result.text)
    console.log("Usage:", result.usage)
  }, 30000) // 30 second timeout for LLM call
})
