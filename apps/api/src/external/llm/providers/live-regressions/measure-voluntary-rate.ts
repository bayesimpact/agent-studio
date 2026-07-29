/**
 * MANUAL measurement harness — makes LIVE LLM calls. Never wire this into
 * jest or CI: it is a plain ts-node script, deliberately NOT a *.spec.ts.
 *
 * Measures the VOLUNTARY call rate of submit_turn_summary (the contract
 * suites only assert the outcome; this script observes the steps and tells
 * voluntary calls apart from what would need the forced end-of-turn
 * generation). Use it to evaluate prompt-engineering iterations before
 * changing the production wording.
 *
 * Usage (from apps/api):
 *
 *   npx ts-node --transpile-only -r tsconfig-paths/register \
 *     src/external/llm/providers/live-regressions/measure-voluntary-rate.ts \
 *     --model gemini-3.1-flash-lite --scenario fat --attempts 3
 *
 * Scenarios: "fat" (no-RAG fat prompt, categorization only) or "rag"
 * (lookup + sources + categorization on the handbook fixture).
 */
import "dotenv/config"
import { createVertex } from "@ai-sdk/google-vertex"
import { createOpenAI } from "@ai-sdk/openai"
import { AgentModel, ToolName } from "@caseai-connect/api-contracts"
import { type LanguageModel, stepCountIs, ToolLoopAgent, type ToolSet, tool } from "ai"
import { z } from "zod"
import {
  LOOKUP_KNOWLEDGE_BASE_DESCRIPTION,
  lookupKnowledgeBaseInstruction,
} from "@/domains/agents/shared/agent-session-messages/streaming/tools/lookup-knowledge-base.tool"
import {
  submitTurnSummaryDescription,
  submitTurnSummaryInstruction,
} from "@/domains/agents/shared/agent-session-messages/streaming/tools/submit-turn-summary.tool"
import { fireAndForgetStopCondition } from "@/external/llm/fire-and-forget-stop-condition"
import { MODEL_VISIBLE_CHUNKS } from "./employee-handbook.fixture"
import { buildFatSystemPrompt } from "./fat-prompt.fixture"

type ScenarioName = "fat" | "rag"

function argValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag)
  return index !== -1 && process.argv[index + 1] ? (process.argv[index + 1] as string) : fallback
}

const modelId = argValue("--model", AgentModel.Gemini31FlashLite)
const scenarioName = argValue("--scenario", "fat") as ScenarioName
const attempts = Number.parseInt(argValue("--attempts", "3"), 10)

function buildModel(): LanguageModel {
  const project = process.env.GOOGLE_VERTEX_PROJECT || "caseai-connect"
  if (modelId.startsWith("gemini-2.5")) {
    return createVertex({ project, location: "europe-west1" })(modelId)
  }
  if (modelId.startsWith("gemini-")) {
    return createVertex({ project, location: "eu" })(modelId)
  }
  if (modelId === AgentModel.Gemma4_26B) {
    const baseURL = process.env.VLLM_GEMMA4_26B_URL
    if (!baseURL) throw new Error("VLLM_GEMMA4_26B_URL is not set")
    return createOpenAI({ name: "measure", baseURL, apiKey: "unused" }).chat(modelId)
  }
  throw new Error(`No model factory for ${modelId} — add one if you need it`)
}

const summaryCategoriesOnly = tool({
  description: submitTurnSummaryDescription({
    includeSources: false,
    includeSessionMetadata: true,
  }),
  inputSchema: z.object({
    categoryNames: z.array(z.string()).max(5),
    suggestedTitle: z.string().nullable(),
  }),
  execute: async () => ({ role: "system", content: "Report received." }),
})

const summaryWithSources = tool({
  description: submitTurnSummaryDescription({ includeSources: true, includeSessionMetadata: true }),
  inputSchema: z.object({
    chunkIds: z.array(z.string()),
    categoryNames: z.array(z.string()).max(5),
    suggestedTitle: z.string().nullable(),
  }),
  execute: async () => ({ role: "system", content: "Report received." }),
})

const lookupStub = tool({
  description: LOOKUP_KNOWLEDGE_BASE_DESCRIPTION,
  inputSchema: z.object({ query: z.string().min(1) }),
  execute: async () => ({
    retrievedChunks: MODEL_VISIBLE_CHUNKS,
    retrievalMetadata: { returnedChunkCount: MODEL_VISIBLE_CHUNKS.length, topK: 20 },
  }),
})

const SCENARIOS: Record<
  ScenarioName,
  {
    systemPrompt: string
    tools: ToolSet
    cases: Array<{ label: string; userMessage: string }>
  }
> = {
  fat: {
    systemPrompt: buildFatSystemPrompt({
      toolsSection: `## Tools:\n[${ToolName.SubmitTurnSummary}]: ${submitTurnSummaryInstruction({
        includeSources: false,
        includeSessionMetadata: true,
      })}`,
    }),
    tools: { [ToolName.SubmitTurnSummary]: summaryCategoriesOnly },
    cases: [
      { label: "greeting", userMessage: "bonjour" },
      { label: "thanks", userMessage: "merci beaucoup !" },
      { label: "service question", userMessage: "comment je change mon mot de passe ?" },
      {
        label: "strict refusal",
        userMessage: "combien je vais toucher d'indemnités exactement ce mois-ci ?",
      },
      { label: "off-topic", userMessage: "raconte-moi une blague" },
    ],
  },
  rag: {
    systemPrompt: `## Purpose
Your purpose is to assist users by answering their questions about the company employee handbook, always refer to your knowledge base.

## Tools:
[${ToolName.LookupKnowledgeBase}]: ${lookupKnowledgeBaseInstruction()}
[${ToolName.SubmitTurnSummary}]: ${submitTurnSummaryInstruction({ includeSources: true, includeSessionMetadata: true })}

## Response language:
Always answer in French.`,
    tools: {
      [ToolName.LookupKnowledgeBase]: lookupStub,
      [ToolName.SubmitTurnSummary]: summaryWithSources,
    },
    cases: [
      { label: "greeting", userMessage: "bonjour" },
      {
        label: "document question",
        userMessage: "j'ai droit a combien de jours de conges payes ?",
      },
    ],
  },
}

async function runOnce(userMessage: string) {
  const scenario = SCENARIOS[scenarioName]
  const agent = new ToolLoopAgent({
    model: buildModel(),
    temperature: 0,
    tools: scenario.tools,
    stopWhen: [
      stepCountIs(6),
      fireAndForgetStopCondition({ fireAndForgetToolNames: [ToolName.SubmitTurnSummary] }),
    ],
  })
  const result = await agent.stream({
    messages: [
      { role: "system", content: scenario.systemPrompt },
      {
        role: "assistant",
        content: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider ?",
      },
      { role: "user", content: userMessage },
    ],
  })
  let text = ""
  for await (const chunk of result.textStream) text += chunk
  const steps = await result.steps
  return {
    answered: text.trim().length > 0,
    voluntary: steps.some((step) =>
      step.toolCalls.some((toolCall) => toolCall.toolName === ToolName.SubmitTurnSummary),
    ),
    lookupRan: steps.some((step) =>
      step.toolCalls.some((toolCall) => toolCall.toolName === ToolName.LookupKnowledgeBase),
    ),
  }
}

async function main() {
  const scenario = SCENARIOS[scenarioName]
  console.log(`model=${modelId} scenario=${scenarioName} attempts=${attempts}\n`)
  for (const scenarioCase of scenario.cases) {
    let voluntaryCount = 0
    let answeredCount = 0
    let lookupCount = 0
    let errorCount = 0
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const outcome = await runOnce(scenarioCase.userMessage)
        if (outcome.voluntary) voluntaryCount++
        if (outcome.answered) answeredCount++
        if (outcome.lookupRan) lookupCount++
      } catch (error) {
        errorCount++
        console.log(`  [${scenarioCase.label}] ERROR: ${(error as Error).message?.slice(0, 100)}`)
      }
    }
    const total = attempts - errorCount
    const lookupInfo = scenarioName === "rag" ? ` lookup=${lookupCount}/${total}` : ""
    console.log(
      `[${scenarioCase.label}] voluntary=${voluntaryCount}/${total} answered=${answeredCount}/${total}${lookupInfo}${errorCount ? ` errors=${errorCount}` : ""}`,
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
