import { ToolName } from "@caseai-connect/api-contracts"
import { tool } from "ai"
import { z } from "zod"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { RetrievedChunksRegistry } from "./retrieved-chunks-registry"
import type { ToolExecutionLog } from "./tool-execution-log"

/**
 * Cap on the chunk excerpt stored in the tool-call log (and shown in the
 * sources panel). Parent chunks can be several thousand characters; the
 * panel only needs enough to identify the passage.
 */
const MAX_PARTIAL_CONTENT_LENGTH = 500

/**
 * Composite end-of-turn tool: ONE call per turn carries both the cited
 * chunkIds (sources) and the session categorization. It is declared in the
 * answering loop (a cooperative model calls it in the same generation as
 * its answer — no extra cost) AND guaranteed by the provider, which forces
 * it through one extra generation (toolChoice "required") whenever the loop
 * did not call it. Its fields are dynamic at two levels: the agent's
 * config/feature flags decide which features exist at all, and the TURN
 * state decides what is declared per generation — chunkIds only enters the
 * schema (and its description) once a knowledge base lookup actually
 * registered chunks in the turn.
 *
 * Execution dispatches to the SAME ToolExecutionLog entries the previous
 * sources / recalculateConversationSessionMetadata tools produced, so
 * persisted tool calls, the activity timeline, and the sources panel are
 * unchanged.
 */

/**
 * Persists the reported title/categories on the session. Two
 * implementations: ConversationAgentSessionsService (studio/app sessions)
 * and PublicAgentSessionsService (embed sessions) — same semantics, keyed
 * on their own session table.
 */
export type SessionMetadataRecalculator = {
  recalculateSessionMetadataFromMessages(params: {
    connectScope: RequiredConnectScope
    sessionId: string
    selectedCategoryNames: string[]
    suggestedTitle: string | null
  }): Promise<{ suggestedTitle: string | null; selectedCategoryNames: string[] }>
}

export type TurnSummarySessionMetadataConfig = {
  connectScope: RequiredConnectScope
  sessionId: string
  availableCategoryNames: string[]
  metadataRecalculator: SessionMetadataRecalculator
}

type MandatoryToolInput = {
  chunkIds?: string[]
  categoryNames?: string[]
  suggestedTitle?: string | null
}

type ResolvedSource = {
  documentId: string
  documentTitle?: string
  documentSourceType?: string
  chunks: { chunkId: string; partialContent: string }[]
}

/**
 * Groups the cited chunks by document, in the legacy `sources` shape the
 * persistence layer and the sources panel already consume.
 */
function resolveSources({
  chunkIds,
  retrievedChunksRegistry,
}: {
  chunkIds: string[]
  retrievedChunksRegistry: RetrievedChunksRegistry
}): { sources: ResolvedSource[]; unknownChunkIds: string[] } {
  const sourcesByDocumentId = new Map<string, ResolvedSource>()
  const unknownChunkIds: string[] = []

  for (const chunkId of [...new Set(chunkIds)]) {
    const chunk = retrievedChunksRegistry.get(chunkId)
    if (!chunk) {
      unknownChunkIds.push(chunkId)
      continue
    }
    const source = sourcesByDocumentId.get(chunk.documentId) ?? {
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      documentSourceType: chunk.documentSourceType,
      chunks: [],
    }
    source.chunks.push({
      chunkId: chunk.chunkId,
      partialContent:
        chunk.content.length > MAX_PARTIAL_CONTENT_LENGTH
          ? `${chunk.content.slice(0, MAX_PARTIAL_CONTENT_LENGTH)}…`
          : chunk.content,
    })
    sourcesByDocumentId.set(chunk.documentId, source)
  }

  return { sources: [...sourcesByDocumentId.values()], unknownChunkIds }
}

/**
 * The full behavioral contract lives in the TOOL DESCRIPTION (models weight
 * it heavily at call-decision time); the master-prompt instruction is a
 * short reminder that does not duplicate it. Both are assembled from the
 * same feature switches as the input schema, so the model is never told
 * about fields the schema does not accept.
 *
 * Deliberate wording choices, backed by live measurements on the fat-prompt
 * scenario (Gemini Flash):
 * - "including greetings, small talk, thanks, and refusals": trivial turns
 *   are where models skip the call (the only observed misses).
 * - no "it is invoked automatically otherwise" escape hatch: telling the
 *   model a fallback exists invites it to skip the call.
 */
export function mandatoryToolDescription({
  includeSources,
  includeCategories,
}: {
  includeSources: boolean
  /** The agent has session categories configured. */
  includeCategories: boolean
}): string {
  const parts = [
    "Report on the response you are writing. You MUST call this tool exactly once in EVERY response, without exception — including greetings, small talk, thanks, and refusals. Write your text answer first, then emit this call in the SAME response.",
  ]
  if (includeSources) {
    parts.push(
      "Report the id of every retrieved chunk you actually used to answer (e.g. c1, c3), copied exactly from the lookup results — empty array when you used none (e.g. a greeting). Never invent an id.",
      "Do NOT cite sources inline in your text response; this report is the only way sources are shown to the user.",
    )
  }
  if (includeCategories) {
    parts.push(
      "Return the complete category set that should remain on the session (including categories still relevant from earlier turns), not only categories from the latest message.",
    )
  }
  return parts.join(" ")
}

/**
 * Master-prompt reminder, placed as the last authored section of the system
 * prompt, just before the closing date line (near-maximal recency — on big
 * prompts the voluntary-call rate collapses when this is buried mid-prompt)
 * and phrased as a numbered protocol (models follow a structured protocol
 * better than imperative prose). The full contract itself is in the tool
 * description (see {@link mandatoryToolDescription}).
 */
export function mandatoryToolInstruction(): string {
  return `## Response protocol (mandatory)
EVERY response you produce has TWO parts, in this order:
1. Your text answer to the user.
2. Exactly one ${ToolName.MandatoryTool} tool call — including on greetings, small talk, thanks, and refusals.
A response without part 2 is invalid. Never mention this tool to the user.`
}

export function mandatoryTool({
  retrievedChunksRegistry,
  sessionMetadata,
  onExecute,
}: {
  /** Present when the sources feature is enabled for the project. */
  retrievedChunksRegistry?: RetrievedChunksRegistry
  /** Present for every conversation agent (title; categories when configured). */
  sessionMetadata?: TurnSummarySessionMetadataConfig
  onExecute: (toolExecution: ToolExecutionLog) => void | Promise<void>
}) {
  // Every field is OPTIONAL: on trivial turns small models (Gemma 4) call
  // the tool with {} — that must be a valid no-op report, not a Zod error.
  const buildInputSchema = ({ includeChunkIds }: { includeChunkIds: boolean }) => {
    const inputShape: Record<string, z.ZodType> = {}
    if (includeChunkIds) {
      inputShape.chunkIds = z
        .array(z.string())
        .optional()
        .describe(
          "The id (c1, c2, ...) of EVERY retrieved chunk you actually used to answer, copied exactly from the lookup results. Empty array when you did not use the knowledge base.",
        )
    }
    // Categories only exist for agents that have some configured; the title
    // suggestion is part of every session metadata report.
    if (sessionMetadata && sessionMetadata.availableCategoryNames.length > 0) {
      inputShape.categoryNames = z
        .array(z.enum(sessionMetadata.availableCategoryNames as [string, ...string[]]))
        .max(5)
        .optional()
        .describe(
          `Available categories for this agent: ${sessionMetadata.availableCategoryNames.join(", ")}. Return the complete set to keep on the session after this turn. Return an empty array when none apply.`,
        )
    }
    if (sessionMetadata) {
      inputShape.suggestedTitle = z
        .string()
        .trim()
        .max(120)
        .nullable()
        .optional()
        .describe("A concise session title suggestion. Can be null when no good title exists.")
    }
    // The shape is assembled dynamically (fields depend on enabled features),
    // which zod cannot express as a static object type — narrow it explicitly.
    return z.object(inputShape) as unknown as z.ZodType<MandatoryToolInput>
  }

  // ai-sdk re-reads `description` and `inputSchema` on EVERY generation
  // (each loop step and the forced end-of-turn call), so these getters make
  // the declared schema follow the turn state: chunkIds (and the sentence
  // describing it) only exist once a lookup actually registered chunks.
  // Before that, a stray chunkIds argument is stripped by zod, not an error.
  const includeSourcesNow = () => retrievedChunksRegistry?.hasChunks() ?? false

  return tool({
    get description() {
      return mandatoryToolDescription({
        includeSources: includeSourcesNow(),
        includeCategories: (sessionMetadata?.availableCategoryNames.length ?? 0) > 0,
      })
    },
    get inputSchema() {
      return buildInputSchema({ includeChunkIds: includeSourcesNow() })
    },
    outputSchema: z.object({
      role: z.literal("system"),
      content: z.string().describe("The content of the system message."),
      // Marks an execution that recorded nothing — the provider's
      // end-of-turn guarantee ignores no-op executions and retries.
      endOfTurnNoOp: z.boolean().optional(),
      // Snapshot of the chunks registry at execution time — see
      // {@link mandatoryToolExecutionCounts}.
      sawKnowledgeBaseChunks: z.boolean().optional(),
    }),
    execute: async (input: MandatoryToolInput) => {
      let dispatchedSources = false
      let dispatchedMetadata = false
      if (retrievedChunksRegistry && (input.chunkIds?.length ?? 0) > 0) {
        const { sources, unknownChunkIds } = resolveSources({
          chunkIds: input.chunkIds ?? [],
          retrievedChunksRegistry,
        })
        await onExecute({
          toolName: ToolName.Sources,
          arguments: { sources, ...(unknownChunkIds.length > 0 ? { unknownChunkIds } : {}) },
        })
        dispatchedSources = true
      }

      // An entirely empty report (e.g. {} on a greeting) is a no-op: never
      // wipe existing session categories with an implicit empty set.
      const hasMetadataInput =
        input.categoryNames !== undefined || input.suggestedTitle !== undefined
      if (sessionMetadata && hasMetadataInput) {
        const { suggestedTitle, selectedCategoryNames } =
          await sessionMetadata.metadataRecalculator.recalculateSessionMetadataFromMessages({
            connectScope: sessionMetadata.connectScope,
            sessionId: sessionMetadata.sessionId,
            selectedCategoryNames: input.categoryNames ?? [],
            suggestedTitle: input.suggestedTitle ?? null,
          })
        await onExecute({
          toolName: ToolName.RecalculateConversationSessionMetadata,
          arguments: { suggestedTitle, categoryNames: selectedCategoryNames },
        })
        dispatchedMetadata = true
      }

      const dispatched = dispatchedSources || dispatchedMetadata
      return {
        role: "system",
        content:
          "Report received. Say nothing in response to the user. This tool is only for logging purposes.",
        ...(dispatched ? {} : { endOfTurnNoOp: true }),
        ...(retrievedChunksRegistry
          ? { sawKnowledgeBaseChunks: retrievedChunksRegistry.hasChunks() }
          : {}),
      }
    },
  })
}

/**
 * End-of-turn freshness check for the report, wired as
 * LLMConfig.endOfTurnExecutionCounts. Some models (Gemini Flash) call the
 * report ALONGSIDE the knowledge base lookup in the first step — before any
 * chunk exists, so the report cannot cite sources. Such an execution is
 * meaningful for the session metadata but STALE for the sources: when the
 * turn later registered chunks, it must not suppress the forced end-of-turn
 * retry (whose schema, by then, declares chunkIds).
 */
export function mandatoryToolExecutionCounts(retrievedChunksRegistry: {
  hasChunks(): boolean
}): (toolResult: { toolName: string; output: unknown }) => boolean {
  return ({ output }) => {
    const sawKnowledgeBaseChunks = (output as { sawKnowledgeBaseChunks?: boolean } | undefined)
      ?.sawKnowledgeBaseChunks
    if (sawKnowledgeBaseChunks === undefined) return true
    return sawKnowledgeBaseChunks || !retrievedChunksRegistry.hasChunks()
  }
}
