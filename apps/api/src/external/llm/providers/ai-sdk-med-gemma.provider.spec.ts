import { AgentModel } from "@caseai-connect/api-contracts"
import { afterAll, beforeAll } from "@jest/globals"
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base"
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
import { config as dotenvConfig } from "dotenv"
import { LangfuseIntegrationExporter } from "@/external/langfuse/langfuse-integration-exporter"
import { AgentModelToAgentProvider, AgentProvider } from "@/external/llm/agent-provider"
import { sdk } from "@/external/llm/open-telemetry-init"
import { AISDKMedGemmaProvider } from "@/external/llm/providers/ai-sdk-med-gemma.provider"
import { ProviderSpecs } from "@/external/llm/providers/provider-specs"

dotenvConfig({ path: ".env", override: true })
dotenvConfig({ path: ".env.test", override: true })
const testModels = Object.values(AgentModel).filter(
  (am) =>
    AgentModelToAgentProvider[am] === AgentProvider.MedGemma &&
    am !== AgentModel.MedGemma15_4B_LanguageModelV2,
)

if (process.env.IS_TEST === "true" && process.env.MEDGEMMA_TEST === "true") {
  describe("AISDKMedGemmaProvider", () => {
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
    let provider: AISDKMedGemmaProvider
    beforeAll(async () => {
      const conf = process.env.GOOGLE_APPLICATION_CREDENTIALS
      if (!conf) return
      provider = new AISDKMedGemmaProvider()
      traceProvider.register()
    })
    afterAll(async () => {
      await langfuse.forceFlush()
      await traceProvider.forceFlush()
      await traceProvider.shutdown()
      await sdk.shutdown()
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
        advancedExpectation: false,
      })
    })
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
const _prompt5 = `## Role & Task
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
