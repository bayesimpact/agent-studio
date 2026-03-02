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
import { AgentModelToAgentProvider, AgentProvider } from "@/external/llm/agent-provider"
import { sdk } from "@/external/llm/open-telemetry-init"
import { AISDKMedGemmaProvider } from "@/external/llm/providers/ai-sdk-med-gemma.provider"
import {
  expectIncludes,
  expectIncludesAtLeastOne,
  includesInsensitive,
} from "@/external/llm/providers/spec-tools"

dotenvConfig({ path: ".env", override: true })
dotenvConfig({ path: ".env.test", override: true })
const testModels = Object.values(AgentModel).filter(
  (am) =>
    AgentModelToAgentProvider[am] === AgentProvider.MedGemma &&
    am !== AgentModel.MedGemma15_4B_LanguageModelV2,
)

if (process.env.IS_TEST === "true" && process.env.MEDGEMMA_TEST === "true") {
  describe("AISDKMedGemmaProvider", () => {
    jest.setTimeout(600_000)
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
    let provider: AISDKMedGemmaProvider
    let messages: LLMChatMessage[]
    let config: LLMConfig
    let metadata: LLMMetadata
    const systemPrompt =
      "You're a medical chat bot named Elvis. Your goal is to answer to the user with the medical knowledge you have"
    const temperature = 0
    beforeAll(async () => {
      const conf = process.env.GOOGLE_APPLICATION_CREDENTIALS
      if (!conf) return
      provider = new AISDKMedGemmaProvider()
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

    it.each(testModels)("generateText - %s", async (model) => {
      metadata.traceId = v4()
      const prompt = "What's your name? answer only your name, no sentence"
      config = { model, temperature, systemPrompt }
      const result = await provider.generateText({ prompt, config, metadata })
      expect(result).toBeDefined()
      expectIncludes(result, "Elvis")
    })

    it.each(testModels)("generateObject - %s", async (model) => {
      metadata.traceId = v4()
      const prompt = "Can I use aspirin if I am bleeding?"
      const schema = z.object({
        yesOrNo: z.string().describe("'yes' or 'no'"),
        justification: z.string().describe("Explain why in 2 or 3 sentences"),
      })
      config = { model, temperature, systemPrompt }
      const result = await provider.generateObject({ schema, prompt, config, metadata })
      expect(result).toBeDefined()
      expect(() => schema.parse(result)).not.toThrow()
      const parsed = schema.parse(result)
      expectIncludes(parsed.yesOrNo, "no")
    })
    it.each(testModels)("generateStructuredOutput -pdf - %s", async (model) => {
      metadata.traceId = v4()
      const schema = z.object({ address: z.string(), phoneNumber: z.string(), email: z.string() })
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
            text:
              "From the file, get the expected values and replace the phone number by 007." +
              "DO NOT HALLUCINATE VALUES, return only values that you find in the file; if no values then return undefined",
          },
          {
            type: testFile.type as "file",
            filename: "test-pdf.pdf",
            mediaType: "application/pdf",
            data: pdfBuffer,
          },
        ],
      }
      config = { model, temperature, systemPrompt }
      const result = await provider.generateStructuredOutput({
        message,
        schema: schema.toJSONSchema(),
        config,
        metadata,
      })
      expect(result).toBeDefined()
      expect(() => schema.parse(result)).not.toThrow()
      const parsed = schema.parse(result)
      expectIncludes(parsed.address, "dreux")
      expect(parsed.phoneNumber.toLowerCase()).toBe("007")
      expect(parsed.email.toLowerCase()).toBe("jdoudou@laposte.net")
    })

    it.each(testModels)("generateStructuredOutput -jpg - %s", async (model) => {
      metadata.traceId = v4()
      const schema = z.array(
        z.object({
          constantName: z.string().describe("le nom de la constante"),
          value: z.number().describe("la valeur de la constante"),
        }),
      )
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
            text: "Extrait du tableau les noms des constantes et leurs valeurs.Retourne tous les noms et les valeurs mais pour la constante nommée 'Pi' remplace la valeur par 0.007",
          },
          {
            type: testFile.type as "file",
            filename: testFile.name,
            mediaType: testFile.mediaType,
            data: testFile.content,
          },
        ],
      }
      config = {
        model,
        temperature,
        systemPrompt: "You're a chat bot named Elvis. Your goal is to answer to the user",
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
    })

    it.each(testModels)("generateStructuredOutput -png - %s", async (model) => {
      metadata.traceId = v4()
      const emergencyLevel = ["faible", "moyen", "eleve"]
      const schema = z.object({
        anomalie_detectee: z.boolean(),
        description: z.string(),
        niveau_urgence: z.enum(emergencyLevel),
        recommandation: z.string(),
      })
      const pngBuffer = await readFile(join(__dirname, `files`, "xray-micro-png.png"))
      const testFile: LLMFile = {
        type: "file",
        name: "xray-micro-png.png",
        mediaType: "image/png",
        content: pngBuffer,
      }
      const message: LLMChatMessage = {
        role: "user",
        content: [
          {
            type: "text",
            // text: `Analyse cette radiographie et extrais les informations sous format JSON strict.Ne renvoie que le JSON, aucun autre texte. Reponds en francais`,
            text: `Analyse cette radiographie et extrais les informations sous format JSON strict.`,
          },
          {
            type: testFile.type as "file",
            filename: testFile.name,
            mediaType: testFile.mediaType,
            data: testFile.content,
          },
        ],
      }
      config = {
        model,
        temperature,
        systemPrompt,
        // systemPrompt:
        //   "Tu es un chat-bot assistant medical.Tu aides les medecins dans leurs taches quotidiennes",
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
    })

    it.each(testModels)("generateStructuredOutput -jpg (large) - %s", async (model) => {
      // expect("large file").toBe("not (yet) supported : infinite call vllm <-> fetch")
      metadata.traceId = v4()
      const emergencyLevel = ["faible", "moyen", "eleve"]
      const schema = z.object({
        anomalie_detectee: z.boolean(),
        description: z.string(),
        niveau_urgence: z.enum(emergencyLevel),
        recommandation: z.string(),
      })
      const pngBuffer = await readFile(join(__dirname, `files`, "xray-jpg.jpg"))
      const testFile: LLMFile = {
        type: "file",
        name: "xray-jpg.jpg",
        mediaType: "image/jpeg",
        content: pngBuffer,
      }
      const _base64 = pngBuffer.toString("base64")
      const message: LLMChatMessage = {
        role: "user",
        content: [
          {
            type: "text",
            // text: `Analyse cette radiographie et extrais les informations sous format JSON strict.Ne renvoie que le JSON, aucun autre texte. Reponds en francais`,
            text: `Analyse cette radiographie et extrais les informations sous format JSON strict.`,
          },
          {
            type: testFile.type as "file",
            filename: testFile.name,
            mediaType: testFile.mediaType,
            data: testFile.content,
          },
        ],
      }
      config = {
        model,
        temperature,
        systemPrompt,
        // systemPrompt:
        //   "Tu es un chat-bot assistant medical.Tu aides les medecins dans leurs taches quotidiennes",
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
    })

    it.each(testModels)("processFiles - %s", async (model) => {
      metadata.traceId = v4()
      const prompt = "About the file(s) in attachment, give a short description (2 or 3 sentences)."

      const pngBuffer = await readFile(join(__dirname, `files`, "xray-micro-png.png"))
      const jpgBuffer = await readFile(join(__dirname, `files`, "test-jpg.jpg"))
      const files: LLMFile[] = [
        {
          type: "file",
          name: "xray-micro-png.png",
          mediaType: "image/png",
          content: pngBuffer,
        },
        {
          type: "file",
          name: "test-jpg.jpg",
          mediaType: "image/jpeg",
          content: jpgBuffer,
        },
      ]

      config = { model, temperature, systemPrompt }
      const result = await provider.processFiles({ prompt, files, config, metadata })
      expect(result).toBeDefined()
      expectIncludes(result, "math")
    })

    it.each(testModels)("streamChatResponse - %s", async (model) => {
      metadata.traceId = v4()
      config = { model, temperature, systemPrompt }
      messages = [{ role: "user", content: "What can you do for me?" }]
      const stream = provider.streamChatResponse({ messages, config, metadata })
      const results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expectIncludesAtLeastOne(results.join(""), ["answer", "ask"])
    })

    it.each(testModels)("streamChatResponse with tools - %s", async (model) => {
      const inputSchema = z.object({
        happy: z.string().describe("Is happy?").optional(),
        hourOfSleep: z.string().describe("How many sleep hours per day?").optional(),
        weight: z.string().describe("weight in kilogrammes (rounded .5)?").optional(),
      })
      inputSchema.parse({ happy: "yes", hourOfSleep: "7", weight: "99.5" })
      // biome-ignore lint/correctness/noUnusedVariables: used in lambda
      const outputForm: Record<string, string | null> = {}
      const status: string = "NOT_STARTED"
      const fillFormTool = tool({
        description: "Fill out a form. Get the values from user's answers.",
        inputSchema,
        outputSchema: z.object({
          status: z
            .string()
            .describe('Whether the form is completed or not : return "completed" OR "in_progress"'),
          formState: inputSchema.describe(
            "The current state of the form, with values filled by the user",
          ),
        }),
        execute: async (input, _options) => {
          // console.log(JSON.stringify(input))
          // outputForm = input
          try {
            const status =
              input.happy && input.hourOfSleep && input.weight ? "completed" : "in_progress"
            console.debug(status)
            return {
              status,
              formState: input,
            }
          } catch (e) {
            console.error(e)
          }
        },
      })
      metadata.traceId = v4()
      config = {
        model,
        temperature,
        systemPrompt: prompt5,
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
      // expect(outputForm.happy).toBeTruthy()
      // expect(!outputForm.hourOfSleep).toBeTruthy()
      // expect(!outputForm.weight).toBeTruthy()

      chatMessages.push({ role: "assistant", content: results.join("") })
      chatMessages.push({ role: "user", content: "I sleep about 7 hours a night" })
      metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
      stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
      results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(status).not.toEqual("completed")
      // expect(outputForm.happy).toEqual(true)
      // expect(outputForm.hourOfSleep).toEqual(7)
      // expect(!outputForm.weight).toBeTruthy()

      chatMessages.push({ role: "assistant", content: results.join("") })
      chatMessages.push({ role: "user", content: "I do not smoke" })
      metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
      stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
      results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(status).not.toEqual("completed")
      // expect(outputForm.happy).toEqual(true)
      // expect(outputForm.hourOfSleep).toEqual(7)
      // expect(!outputForm.weight).toBeTruthy()

      chatMessages.push({ role: "assistant", content: results.join("") })
      chatMessages.push({ role: "user", content: "99.4 kg" })
      metadata.currentTurn = chatMessages.filter((message) => message.role === "user").length
      stream = provider.streamChatResponse({ messages: chatMessages, config, metadata })
      results = await streamToStringArray(stream)
      expect(results).toBeDefined()
      expect(results.length).toBeGreaterThan(0)
      expect(status).toEqual("completed")
      // expect(outputForm.happy).toEqual(true)
      // expect(outputForm.hourOfSleep).toEqual(7)
      // expect(outputForm.weight).toBeGreaterThan(99)
      // expect(outputForm.weight).toBeLessThan(100)
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
  describe.skip("AISDKMedGemmaProvider", () => {
    it.each(
      testModels,
    )("skipped (requires process.env.IS_TEST=true and process.env.MEDGEMMA_TEST=true)", () => {})
  })
}
const _prompt = `Today's date: 10/03/2026
##Instructions:
Your main task is to help the user fill out the form by asking questions and providing guidance. 
Ask one question at a time to fill out the form.
Here are the form fields to fill:

    happy: Is happy?
    hourOfSleep: How many sleep hours per day?
    weight: weight in kilogrammes (rounded .5)?

##Tools:
You should use "fillForm" tool to fill out the form, each time you got a response that can be used to fill the form. 
Call "fillForm" each times you have a new information or an updated one: pass undefined for fields that are not filled yet. 
You can also update previously filled information if the user changes their answer. 
After getting response from the tool "fillForm", continue asking the user until the status is "completed".
If the status is "completed" just send a message to the user that indicates that the form has been completed.
Response language: Always answer in English.`
const _promptBis = `## Role & Task
You are a helpful medical assistant. Your main task is to help the user fill out a health form by asking questions and providing guidance. 

## Form Fields to Collect
- happy: Is the user happy? (Yes/No)
- hourOfSleep: How many hours of sleep per day? (Number)
- weight: Weight in kilograms, rounded to the nearest 0.5. (Number)

## Rules for Asking Questions
1. Ask ONLY ONE question at a time.
2. Wait for the user's response before proceeding.
3. Response language: Always answer in English.

## TOOL CALLING INSTRUCTIONS (CRITICAL)
Whenever the user provides an answer that provides new information or updates existing information for the form, YOUR RESPONSE MUST BE A TOOL CALL to "fillForm". 
Do not just acknowledge the answer in plain text: you MUST immediately trigger the "fillForm" tool.

- Rule 1: Call "fillForm" with the new or updated information.
- Rule 2: For fields that are not yet filled, simply omit them (do not send them in the tool call).
- Rule 3: You can update previously filled information if the user changes their mind.

## Workflow After Tool Call
- After you call "fillForm", you will receive a status back.
- IF status is "incomplete": Look at which fields are still missing and ask the user the next logical question.
- IF status is "completed": Do not ask any more questions. Just send a polite final message to the user indicating that the form is successfully completed.

## ANTI-LOOP & FORMATTING RULES (CRITICAL)
1. NO PSEUDO-CODE: Never write text like "I will call fillForm", "Call fillForm(happy=Yes)", or "Wait for user response". 
2. NO PLANNING: Do not explain your thought process. Do not simulate the user's future answers.
3. DIRECT ACTION: If you need to use the tool, trigger the actual tool function directly using the JSON function calling format. Do not type the tool name in plain text.
4. ONLY ONE ACTION: Either ask the user a direct question in plain text, OR trigger the tool. Never do both in the same text block. Stop generating text immediately after asking your question.`
const _promptTer = `## Role & Task
You are a helpful medical assistant. Your main task is to help the user fill out a health form by asking questions.

## Form Fields to Collect
- happy: Is the user happy? (Yes/No)
- hourOfSleep: How many hours of sleep per day? (Number)
- weight: Weight in kilograms, rounded to the nearest 0.5. (Number)

## TOOL CALLING INSTRUCTIONS (CRITICAL)
You have access to a tool named "fillForm". 
Whenever the user provides an answer that updates the form, you MUST trigger this tool.

CRITICAL RULES FOR TOOL RESPONSES:
1. NO CHIT-CHAT: When you call a tool, DO NOT add any conversational text before or after the tool call. Do not say "Okay", "Thank you", or ask the next question.
2. EXACT FORMAT ONLY: Your ENTIRE response must consist ONLY of the markdown tool_call block. 
3. STOP IMMEDIATELY: Stop generating any text immediately after the closing backticks of the tool call.
4. DO NOT USE REASONING BLOCKS: Do not generate <unused94> or <unused95> tokens. Do not use a thought process. Directly output the tool call.

Example of a PERFECT response when updating the form:
\`\`\`tool_call
{
  "tool_call": "fillForm",
  "arguments": {
    "happy": "Yes"
  }
}

## Workflow
- Ask ONLY ONE question at a time.
- IF the user provides an answer that updates the form you MUST immediately call the "fillForm" tool using the appropriate JSON format.
- Once you get the tool response :
    - IF tool status is "incomplete": Ask the user the next missing field.
    - IF tool status is "completed": Stop asking questions. Send a polite final message indicating completion.`
const _prompt4 = `## Role & Task
You are a helpful medical assistant. Your main task is to help the user fill out a health form by asking questions.

## Form Fields to Collect
- happy: Is the user happy? (Yes/No)
- hourOfSleep: How many hours of sleep per day? (Number)
- weight: Weight in kilograms, rounded to the nearest 0.5. (Number)

## TOOL CALLING INSTRUCTIONS (CRITICAL)
You have access to a tool named "fillForm". 
Whenever the user provides an answer that updates the form, you MUST trigger this tool.

CRITICAL RULES FOR TOOL RESPONSES:
1. NO CHIT-CHAT: When you call a tool, DO NOT add any conversational text before or after the tool call. Do not say "Okay", "Thank you", or ask the next question.
2. EXACT FORMAT ONLY: Your ENTIRE response must consist ONLY of the XML <tool_call> block. 
3. STOP IMMEDIATELY: Stop generating any text immediately after the closing backticks of the tool call.
4. DO NOT USE REASONING BLOCKS: Do not generate <unused94> or <unused95> tokens. Do not use a thought process. Directly output the tool call.
5. IMPORTANT: When you need to call a tool, you MUST use the following exact XML format. Do not use markdown blocks like '''tool_call.
      <tool_call>
      {"name": "fillForm", "arguments": {"happy": "Yes"}}
      </tool_call>


## Workflow
- Ask ONLY ONE question at a time.
- IF the user provides an answer that updates the form you MUST immediately call the "fillForm" tool using the appropriate JSON format.
- Once you get the tool response :
    - IF tool status is "incomplete": Ask the user the next missing field.
    - IF tool status is "completed": Stop asking questions. Send a polite final message indicating completion.`
const prompt5 = `## Role & Task
You are a helpful medical assistant. Your main task is to help the user fill out a health form by asking questions.

## Form Fields to Collect
- happy: Is the user happy? (Yes/No)
- hourOfSleep: How many hours of sleep per day? (Number)
- weight: Weight in kilograms, rounded to the nearest 0.5. (Number)

## TOOL CALLING INSTRUCTIONS (CRITICAL)
You have access to a tool named "fillForm". 
Whenever the user provides an answer that updates the form, you MUST trigger this tool.

CRITICAL RULES FOR TOOL RESPONSES:
1. NO CHIT-CHAT: When you call a tool, DO NOT add any conversational text before or after the tool call. Do not say "Okay", "Thank you", or ask the next question.
2. EXACT FORMAT ONLY: You MUST output valid OpenAI messages.
Every message MUST include a "role" field.
When calling a tool, output ONLY:

{
  "role": "assistant",
  "tool_calls": [
    {
      "id": "...",
      "type": "function",
      "function": {
        "name": "...",
        "arguments": "{...}"
      }
    }
  ]
}

Do NOT output <thinking>, <tool_call>, python syntax, or explanations.

3. STOP IMMEDIATELY: Stop generating any text immediately after the closing backticks of the tool call.

## Workflow
- Ask ONLY ONE question at a time.
- IF the user provides an answer that updates the form you MUST immediately call the "fillForm" tool using the appropriate JSON format. ALWAYS call the tool to have a response: do not invent any possible response from the
- Once you get the tool response :
    - IF tool status is "incomplete": Ask the user the next missing field.
    - IF tool status is "completed": Stop asking questions. Send a polite final message indicating completion.`
