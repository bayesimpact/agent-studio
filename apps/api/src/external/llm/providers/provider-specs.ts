import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { tool } from "@ai-sdk/provider-utils"
import type { ToolSet } from "ai"
import { v4 } from "uuid"
import { z } from "zod"
import type { LLMChatMessage, LLMProvider } from "@/common/interfaces/llm-provider.interface"
import {
  expectIncludes,
  expectIncludesAtLeastOne,
  includesInsensitive,
} from "@/external/llm/providers/spec-tools"

// biome-ignore lint/complexity/noStaticOnlyClass: helper
export class ProviderSpecs {
  private static systemPrompt =
    "You're a chat bot named Elvis. Your goal is to answer to the user with the knowledge you have"
  private static temperature = 0

  private static getMetadata() {
    return {
      agentId: "agentId",
      agentSessionId: "agentSessionId",
      currentTurn: 0,
      organizationId: "organizationId",
      projectId: "projectId",
      tags: ["**TEST**"],
      traceId: v4(),
    }
  }

  static async testGenerateText({ provider, model }: { provider: LLMProvider; model: string }) {
    const metadata = ProviderSpecs.getMetadata()
    const prompt = "What's your name?"
    const config = {
      model,
      temperature: ProviderSpecs.temperature,
      systemPrompt: ProviderSpecs.systemPrompt,
    }
    const result = await provider.generateText({ prompt, config, metadata })
    expect(result).toBeDefined()
    expectIncludes(result, "Elvis")
  }
  static async testGenerateObject({ provider, model }: { provider: LLMProvider; model: string }) {
    const metadata = ProviderSpecs.getMetadata()
    const prompt = "Can I use aspirin if I am bleeding?"
    const schema = z.object({
      yesOrNo: z.string().describe("'yes' or 'no'"),
      justification: z.string().describe("Explain why in 2 or 3 sentences"),
    })
    const config = {
      model,
      temperature: ProviderSpecs.temperature,
      systemPrompt: ProviderSpecs.systemPrompt,
    }
    const result = await provider.generateObject({ schema, prompt, config, metadata })
    expect(result).toBeDefined()
    expect(() => schema.parse(result)).not.toThrow()
    const parsed = schema.parse(result)
    expectIncludes(parsed.yesOrNo, "no")
  }
  static async testStreamChatResponse({
    provider,
    model,
  }: {
    provider: LLMProvider
    model: string
  }) {
    const metadata = ProviderSpecs.getMetadata()
    const messages: LLMChatMessage[] = [{ role: "user", content: "What can you do for me?" }]
    const config = {
      model,
      temperature: ProviderSpecs.temperature,
      systemPrompt: ProviderSpecs.systemPrompt,
    }
    const stream = provider.streamChatResponse({ messages, config, metadata })
    const results = await ProviderSpecs.streamToStringArray(stream)
    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThan(0)
    expectIncludesAtLeastOne(results.join(""), ["answer", "ask"])
  }
  static async testStreamChatResponseWithTools({
    provider,
    model,
    advancedExpectation,
  }: {
    provider: LLMProvider
    model: string
    advancedExpectation: boolean
  }) {
    const prompt = `##Instructions:
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
    const config = {
      model,
      temperature: ProviderSpecs.temperature,
      systemPrompt: prompt,
      tools: { fillForm: fillFormTool } as ToolSet,
    }
    const chatMessages: LLMChatMessage[] = [{ role: "user", content: "Hello" }]
    const metadata = ProviderSpecs.getMetadata()
    const traceId = metadata.traceId
    metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
    let stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
    let results = await ProviderSpecs.streamToStringArray(stream)
    expect(results).toBeDefined()
    console.log(JSON.stringify(results))
    expect(results.length).toBeGreaterThan(0)
    if (advancedExpectation) {
      expect(status).not.toEqual("completed")
      expect(!outputForm.happy).toBeTruthy()
      expect(!outputForm.hourOfSleep).toBeTruthy()
      expect(!outputForm.weight).toBeTruthy()
    }

    chatMessages.push({ role: "assistant", content: results.join("") })
    chatMessages.push({ role: "user", content: "I'm happy" })
    const metadata2 = ProviderSpecs.getMetadata()
    metadata2.currentTurn = chatMessages.filter((message) => message.role === "user").length
    metadata2.traceId = traceId
    stream = provider.streamChatResponse({ messages: chatMessages, config, metadata: metadata2 })
    results = await ProviderSpecs.streamToStringArray(stream)
    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThan(0)
    if (advancedExpectation) {
      expect(status).not.toEqual("completed")
      expect(outputForm.happy).toBeTruthy()
      expect(!outputForm.hourOfSleep).toBeTruthy()
      expect(!outputForm.weight).toBeTruthy()
    }

    chatMessages.push({ role: "assistant", content: results.join("") })
    chatMessages.push({ role: "user", content: "I sleep about 7 hours a night" })
    const metadata3 = ProviderSpecs.getMetadata()
    metadata3.currentTurn = chatMessages.filter((message) => message.role === "user").length
    metadata3.traceId = traceId
    stream = provider.streamChatResponse({ messages: chatMessages, config, metadata: metadata3 })
    results = await ProviderSpecs.streamToStringArray(stream)
    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThan(0)
    if (advancedExpectation) {
      expect(status).not.toEqual("completed")
      expect(outputForm.happy).toEqual(true)
      expect(outputForm.hourOfSleep).toEqual(7)
      expect(!outputForm.weight).toBeTruthy()
    }

    chatMessages.push({ role: "assistant", content: results.join("") })
    chatMessages.push({ role: "user", content: "I do not smoke" })
    const metadata4 = ProviderSpecs.getMetadata()
    metadata4.currentTurn = chatMessages.filter((message) => message.role === "user").length
    metadata4.traceId = traceId
    stream = provider.streamChatResponse({ messages: chatMessages, config, metadata: metadata4 })
    results = await ProviderSpecs.streamToStringArray(stream)
    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThan(0)
    if (advancedExpectation) {
      expect(status).not.toEqual("completed")
      expect(outputForm.happy).toEqual(true)
      expect(outputForm.hourOfSleep).toEqual(7)
      expect(!outputForm.weight).toBeTruthy()
    }

    chatMessages.push({ role: "assistant", content: results.join("") })
    chatMessages.push({ role: "user", content: "99.4 kg" })
    const metadata5 = ProviderSpecs.getMetadata()
    metadata5.currentTurn = chatMessages.filter((message) => message.role === "user").length
    metadata5.traceId = traceId
    stream = provider.streamChatResponse({ messages: chatMessages, config, metadata: metadata5 })
    results = await ProviderSpecs.streamToStringArray(stream)
    expect(results).toBeDefined()
    expect(results.length).toBeGreaterThan(0)

    expect(status).toEqual("completed")
    expect(outputForm.happy).toEqual(true)
    expect(outputForm.hourOfSleep).toEqual(7)
    expect(outputForm.weight).toBeGreaterThan(99)
    expect(outputForm.weight).toBeLessThan(100)
  }

  private static async streamToStringArray(
    stream: AsyncGenerator<string, void, unknown>,
  ): Promise<string[]> {
    const values: string[] = []
    for await (const chunk of stream) {
      values.push(chunk)
    }
    return values
  }

  static async testGenerateStructuredOutputFromPdf({
    provider,
    model,
  }: {
    provider: LLMProvider
    model: string
  }) {
    const prompt = `From the file, get the expected values and replace the phone number by 007.
DO NOT HALLUCINATE VALUES, return only values that you find in the file; if no values then return undefined`
    const metadata = ProviderSpecs.getMetadata()
    const schema = z.object({ adresse: z.string(), telephone: z.string(), courriel: z.string() })
    const filename = "test-pdf.pdf"
    const buffer = await readFile(join(__dirname, `files`, filename))
    const message: LLMChatMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt,
        },
        {
          type: "file",
          filename,
          mediaType: "application/pdf",
          data: buffer,
        },
      ],
    }
    const config = {
      model,
      temperature: ProviderSpecs.temperature,
      systemPrompt: ProviderSpecs.systemPrompt,
    }
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
  }
  static async testGenerateStructuredOutputFromMathematicalJpg({
    provider,
    model,
  }: {
    provider: LLMProvider
    model: string
  }) {
    const prompt = `From the input table, extract each constant name and its value. 
Output the full list unchanged, except for the constant named ‘Pi’, which must have its value replaced by 0.007.`
    const metadata = ProviderSpecs.getMetadata()
    const schema = z.array(
      z.object({
        constantName: z.string().describe("the name of the constant"),
        value: z.number().describe("the value of the constant"),
      }),
    )
    const filename = "test-jpg.jpg"
    const buffer = await readFile(join(__dirname, `files`, filename))
    const message: LLMChatMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt,
        },
        {
          type: "file",
          filename,
          mediaType: "image/jpeg",
          data: buffer,
        },
      ],
    }
    const config = {
      model,
      temperature: ProviderSpecs.temperature,
      systemPrompt: ProviderSpecs.systemPrompt,
    }
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
    const catalan = parsed.filter((c) => includesInsensitive(c.constantName, "catalan"))
    expect(catalan.length).toBe(1)
    expect(catalan[0]?.value).toBe(0.9159655941)
    const pi = parsed.filter((c) => includesInsensitive(c.constantName, "pi"))
    expect(pi.length).toBe(1)
    expect(pi[0]?.value).toBe(0.007)
  }

  static async testGenerateStructuredOutputFromXRayPng_FR({
    provider,
    model,
  }: {
    provider: LLMProvider
    model: string
  }) {
    const filename = "xray-png.png"
    await ProviderSpecs.testGenerateStructuredOutputFromXRay(filename, model, provider)
  }

  static async testGenerateStructuredOutputFromXRayLowPng_FR({
    provider,
    model,
  }: {
    provider: LLMProvider
    model: string
  }) {
    const filename = "xray-micro-png.png"
    await ProviderSpecs.testGenerateStructuredOutputFromXRay(filename, model, provider)
  }

  static async testGenerateStructuredOutputFromXRayJpg_FR({
    provider,
    model,
  }: {
    provider: LLMProvider
    model: string
  }) {
    const filename = "xray-jpg.jpg"
    await ProviderSpecs.testGenerateStructuredOutputFromXRay(filename, model, provider)
  }

  private static async testGenerateStructuredOutputFromXRay(
    filename: string,
    model: string,
    provider: LLMProvider,
  ) {
    const systemPromptFr =
      "Tu es un chat bot nommé Elvis. Ton objectif est de répondre aux utilisateurs en focntion des connaissances dont tu disposes"
    const prompt = `Analyse cette radiographie et extrais les informations sous format JSON strict.`
    const metadata = ProviderSpecs.getMetadata()
    const emergencyLevel = ["faible", "moyen", "eleve"]
    const schema = z.object({
      anomalie_detectee: z.boolean(),
      description: z.string(),
      niveau_urgence: z.enum(emergencyLevel),
      recommandation: z.string(),
    })
    const buffer = await readFile(join(__dirname, `files`, filename))
    const message: LLMChatMessage = {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt,
        },
        {
          type: "file",
          filename,
          mediaType: "image/jpeg",
          data: buffer,
        },
      ],
    }
    const config = {
      model,
      temperature: ProviderSpecs.temperature,
      systemPrompt: systemPromptFr,
    }
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
    expect(parsed.anomalie_detectee).toBeDefined()
    expect(parsed.description.length).toBeGreaterThan(0)
    expect(emergencyLevel.some((el) => el === parsed.niveau_urgence)).toBeTruthy()
    expect(parsed.recommandation.length).toBeGreaterThan(0)
  }
}
