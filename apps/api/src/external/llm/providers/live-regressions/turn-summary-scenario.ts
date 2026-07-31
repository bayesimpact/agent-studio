import { ToolName } from "@caseai-connect/api-contracts"
import { tool } from "ai"
import { z } from "zod"
import type { LLMProvider } from "@/common/interfaces/llm-provider.interface"
import {
  LOOKUP_KNOWLEDGE_BASE_DESCRIPTION,
  lookupKnowledgeBaseInstruction,
} from "@/domains/agents/shared/agent-session-messages/streaming/tools/lookup-knowledge-base.tool"
import {
  mandatoryTool,
  mandatoryToolExecutionCounts,
  mandatoryToolInstruction,
} from "@/domains/agents/shared/agent-session-messages/streaming/tools/mandatory.tool"
import { createRetrievedChunksRegistry } from "@/domains/agents/shared/agent-session-messages/streaming/tools/retrieved-chunks-registry"
import type { ToolExecutionLog } from "@/domains/agents/shared/agent-session-messages/streaming/tools/tool-execution-log"
import { HANDBOOK_CHUNKS } from "./employee-handbook.fixture"
import { buildFatSystemPrompt } from "./fat-prompt.fixture"

export const HANDBOOK_DOCUMENT_ID = "b7a3f1c2-8d4e-4a91-b2c5-6e7f8a9d0c1b"

/**
 * Provider-agnostic production-shaped turn: the FULL provider pipeline (real
 * tool loop, alias registry, mandatory_tool declared in the loop AND
 * guaranteed at end of turn) over a realistic top-20 retrieval on a fictional
 * employee handbook.
 *
 * Returns the streamed text and the tool-execution logs, so specs can assert
 * the reliability contract on any provider: an answer for the user, and the
 * turn summary executed exactly once.
 */
export async function runTurnSummaryScenario({
  provider,
  model,
}: {
  provider: LLMProvider
  model: string
}): Promise<{ text: string; toolExecutions: ToolExecutionLog[] }> {
  const registry = createRetrievedChunksRegistry()
  const toolExecutions: ToolExecutionLog[] = []
  const onExecute = (toolExecution: ToolExecutionLog) => {
    toolExecutions.push(toolExecution)
  }

  const lookupTool = tool({
    // The exact production description — the epistemic framing is part of
    // what these tests measure.
    description: LOOKUP_KNOWLEDGE_BASE_DESCRIPTION,
    inputSchema: z.object({ query: z.string().min(1) }),
    execute: async () => ({
      retrievedChunks: HANDBOOK_CHUNKS.map((handbookChunk) => ({
        id: registry.register(handbookChunk),
        documentTitle: handbookChunk.documentTitle,
        content: handbookChunk.content,
      })),
      retrievalMetadata: { returnedChunkCount: HANDBOOK_CHUNKS.length, topK: 20 },
    }),
  })

  const turnSummary = mandatoryTool({
    retrievedChunksRegistry: registry,
    sessionMetadata: {
      connectScope: { organizationId: "org-1", projectId: "project-1" },
      sessionId: "session-1",
      availableCategoryNames: ["HR", "IT", "Other"],
      conversationAgentSessionsService: {
        recalculateSessionMetadataFromMessages: async ({
          selectedCategoryNames,
          suggestedTitle,
        }: {
          selectedCategoryNames: string[]
          suggestedTitle: string | null
        }) => ({ suggestedTitle, selectedCategoryNames }),
      } as never,
    },
    onExecute,
  })

  // Mirrors the production master-prompt layout: the turn-summary protocol
  // is the FINAL section (recency), not a line in the Tools section.
  const systemPrompt = `## Purpose
Your purpose is to assist users by answering their questions about the company employee handbook, always refer to your knowledge base.

## Tools:
[${ToolName.LookupKnowledgeBase}]: ${lookupKnowledgeBaseInstruction()}

## Response language:
Always answer in English.

${mandatoryToolInstruction()}`

  const chunks = provider.streamChatResponse({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "how many days of paid leave am I entitled to?" },
    ],
    config: {
      model,
      temperature: 0,
      tools: {
        [ToolName.LookupKnowledgeBase]: lookupTool,
        // Declared in the loop (callable from turn 1, like the KB)...
        [ToolName.MandatoryTool]: turnSummary,
      },
      // ...and guaranteed at end of turn if the loop did not call it.
      endOfTurnTools: {
        [ToolName.MandatoryTool]: turnSummary,
      },
      // A report submitted alongside/before the lookup is stale for the
      // sources part — the forced retry must still run (production wiring).
      endOfTurnExecutionCounts: mandatoryToolExecutionCounts(registry),
      fireAndForgetToolNames: [ToolName.MandatoryTool],
    },
    metadata: {
      traceId: `live-regression-${model}`,
      agentSessionId: `live-regression-session`,
      currentTurn: 1,
      organizationId: "org-1",
      agentId: "agent-1",
      revision: 1,
      projectId: "project-1",
      tags: ["live-provider-regressions", model],
    },
  })

  let text = ""
  for await (const chunk of chunks) text += chunk
  return { text, toolExecutions }
}

export const FAT_AGENT_CATEGORY_NAMES = [
  "Mobility",
  "Training",
  "Allowances",
  "Account",
  "Out of scope",
]

/**
 * No-RAG production-shaped turn: an agent whose whole referential lives in a
 * ~9k-token system prompt (no lookup tool at all), with strict guardrails
 * competing with the turn-summary instruction. This is the configuration
 * where models are most tempted to skip the bookkeeping call.
 */
export async function runFatPromptTurnScenario({
  provider,
  model,
  userMessage,
}: {
  provider: LLMProvider
  model: string
  userMessage: string
}): Promise<{ text: string; toolExecutions: ToolExecutionLog[] }> {
  const toolExecutions: ToolExecutionLog[] = []
  const onExecute = (toolExecution: ToolExecutionLog) => {
    toolExecutions.push(toolExecution)
  }

  const turnSummary = mandatoryTool({
    sessionMetadata: {
      connectScope: { organizationId: "org-1", projectId: "project-1" },
      sessionId: "session-1",
      availableCategoryNames: FAT_AGENT_CATEGORY_NAMES,
      conversationAgentSessionsService: {
        recalculateSessionMetadataFromMessages: async ({
          selectedCategoryNames,
          suggestedTitle,
        }: {
          selectedCategoryNames: string[]
          suggestedTitle: string | null
        }) => ({ suggestedTitle, selectedCategoryNames }),
      } as never,
    },
    onExecute,
  })

  // The protocol is appended AFTER the fat prompt (recency), mirroring the
  // production layout; the toolsSection stays empty of it.
  const systemPrompt = `${buildFatSystemPrompt({ toolsSection: "" })}

${mandatoryToolInstruction()}`

  const chunks = provider.streamChatResponse({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "assistant",
        content: "Hello! I am your virtual assistant. How can I help you today?",
      },
      { role: "user", content: userMessage },
    ],
    config: {
      model,
      temperature: 0,
      tools: { [ToolName.MandatoryTool]: turnSummary },
      endOfTurnTools: { [ToolName.MandatoryTool]: turnSummary },
      fireAndForgetToolNames: [ToolName.MandatoryTool],
    },
    metadata: {
      traceId: `live-regression-fat-${model}`,
      agentSessionId: "live-regression-fat-session",
      currentTurn: 1,
      organizationId: "org-1",
      agentId: "agent-1",
      revision: 1,
      projectId: "project-1",
      tags: ["live-provider-regressions", "fat-prompt", model],
    },
  })

  let text = ""
  for await (const chunk of chunks) text += chunk
  return { text, toolExecutions }
}
