import { AgentModel } from "@caseai-connect/api-contracts"
import type { LLMConfig } from "@/common/interfaces/llm-provider.interface"
import { CallOrigin } from "@/external/llm/ai-sdk-llm-provider-base"
import { CustomMedGemmaLanguageModel } from "./custom-med-gemma-language-model"

describe("CustomMedGemmaLanguageModel", () => {
  const buildConfig = (): LLMConfig => ({
    model: AgentModel.MedGemma10_27B,
    temperature: 0,
  })

  const buildModel = () =>
    new CustomMedGemmaLanguageModel({
      baseUrl: "http://medgemma.test",
      apiKey: "k",
      config: buildConfig(),
    })

  const chatCompletionsResponse = () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: "{}" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
      { status: 200 },
    )

  afterEach(() => {
    jest.restoreAllMocks()
    delete process.env.API_PUBLIC_BASE_URL
  })

  it("passes an https image URL through as an OpenAI-style image_url part", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(chatCompletionsResponse())
    const imageUrl =
      "https://api.example.test/organizations/o/projects/p/agent-attachment-documents/a/pdf-pages/1"

    await buildModel().doGenerate({
      prompt: [
        {
          role: "user",
          content: [{ type: "file", mediaType: "image/png", data: new URL(imageUrl) }],
        },
      ],
      providerOptions: { custom: { callOrigin: CallOrigin.generateStructuredOutput } },
      responseFormat: { type: "json", schema: { type: "object", properties: {} } },
    })

    const [, calledInit] = fetchSpy.mock.calls[0]!
    const body = JSON.parse(String(calledInit?.body))
    expect(body.messages[0].content).toEqual([{ type: "image_url", image_url: { url: imageUrl } }])
  })

  it("still base64-inlines byte image parts", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(chatCompletionsResponse())

    await buildModel().doGenerate({
      prompt: [
        {
          role: "user",
          content: [{ type: "file", mediaType: "image/png", data: new Uint8Array([1, 2, 3]) }],
        },
      ],
      providerOptions: { custom: { callOrigin: CallOrigin.generateStructuredOutput } },
      responseFormat: { type: "json", schema: { type: "object", properties: {} } },
    })

    const [, calledInit] = fetchSpy.mock.calls[0]!
    const body = JSON.parse(String(calledInit?.body))
    const base64 = Buffer.from([1, 2, 3]).toString("base64")
    expect(body.messages[0].content).toEqual([
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
    ])
  })

  describe("supportedUrls", () => {
    it("allows the API's public origin and GCS signed urls when API_PUBLIC_BASE_URL is set", () => {
      process.env.API_PUBLIC_BASE_URL = "https://api.example.test"
      const allowedPatterns = buildModel().supportedUrls["image/*"]

      const matchesAny = (candidateUrl: string) =>
        allowedPatterns.some((pattern) => pattern.test(candidateUrl))

      expect(
        matchesAny(
          "https://api.example.test/organizations/o/projects/p/agent-attachment-documents/a/pdf-pages/1",
        ),
      ).toBe(true)
      expect(matchesAny("https://storage.googleapis.com/bucket/x.png")).toBe(true)
      expect(matchesAny("https://evil.example.com/x.png")).toBe(false)
      expect(matchesAny("http://169.254.169.254/latest")).toBe(false)
    })

    it("only allows GCS signed urls when API_PUBLIC_BASE_URL is unset", () => {
      delete process.env.API_PUBLIC_BASE_URL
      const allowedPatterns = buildModel().supportedUrls["image/*"]

      expect(allowedPatterns).toHaveLength(1)
      expect(
        allowedPatterns.some((pattern) =>
          pattern.test("https://storage.googleapis.com/bucket/x.png"),
        ),
      ).toBe(true)
    })
  })
})
