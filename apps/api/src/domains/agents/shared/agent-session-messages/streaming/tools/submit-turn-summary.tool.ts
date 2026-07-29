import { ToolName } from "@caseai-connect/api-contracts"
import { tool } from "ai"
import { z } from "zod"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { ConversationAgentSessionsService } from "@/domains/agents/conversation-agent-sessions/conversation-agent-sessions.service"
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
 * did not call it. Only its fields stay dynamic, following the agent's
 * config/feature flags.
 *
 * Execution dispatches to the SAME ToolExecutionLog entries the previous
 * sources / recalculateConversationSessionMetadata tools produced, so
 * persisted tool calls, the activity timeline, and the sources panel are
 * unchanged.
 */

export type TurnSummarySessionMetadataConfig = {
  connectScope: RequiredConnectScope
  sessionId: string
  availableCategoryNames: string[]
  conversationAgentSessionsService: ConversationAgentSessionsService
}

type SubmitTurnSummaryInput = {
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
export function submitTurnSummaryDescription({
  includeSources,
  includeSessionMetadata,
}: {
  includeSources: boolean
  includeSessionMetadata: boolean
}): string {
  const parts = [
    "Report on the response you are writing. You MUST call this tool exactly once in EVERY response, without exception — including greetings, small talk, thanks, and refusals. Write your text answer first, then emit this call in the SAME response.",
  ]
  if (includeSources) {
    parts.push(
      "Report the id of every retrieved chunk you actually used to answer (e.g. c1, c3), copied exactly from the lookup results — empty array when you used none (e.g. a greeting). Never invent an id.",
    )
  }
  if (includeSessionMetadata) {
    parts.push(
      "Return the complete category set that should remain on the session (including categories still relevant from earlier turns), not only categories from the latest message.",
    )
  }
  return parts.join(" ")
}

/**
 * Short master-prompt reminder — the contract itself is in the tool
 * description (see {@link submitTurnSummaryDescription}).
 */
export function submitTurnSummaryInstruction({
  includeSources,
}: {
  includeSources: boolean
  includeSessionMetadata: boolean
}): string {
  const parts = [
    `You MUST call the ${ToolName.SubmitTurnSummary} tool exactly once in EVERY response, without exception — including greetings, small talk, thanks, and refusals. Write your text answer first, then emit the call in the SAME response. Never end a response without this call. Never mention it to the user.`,
  ]
  if (includeSources) {
    parts.push(
      `Do NOT cite sources inline in your text response; the ${ToolName.SubmitTurnSummary} report is the only way sources are shown to the user.`,
    )
  }
  return parts.join(" ")
}

export function submitTurnSummaryTool({
  retrievedChunksRegistry,
  sessionMetadata,
  onExecute,
}: {
  /** Present when the sources feature is enabled for the project. */
  retrievedChunksRegistry?: RetrievedChunksRegistry
  /** Present when the agent has session categories and metadata tools are included. */
  sessionMetadata?: TurnSummarySessionMetadataConfig
  onExecute: (toolExecution: ToolExecutionLog) => void | Promise<void>
}) {
  // Every field is OPTIONAL: on trivial turns small models (Gemma 4) call
  // the tool with {} — that must be a valid no-op report, not a Zod error.
  const inputShape: Record<string, z.ZodType> = {}
  if (retrievedChunksRegistry) {
    inputShape.chunkIds = z
      .array(z.string())
      .optional()
      .describe(
        "The id (c1, c2, ...) of EVERY retrieved chunk you actually used to answer, copied exactly from the lookup results. Empty array when you did not use the knowledge base.",
      )
  }
  if (sessionMetadata) {
    const categoryNameSchema =
      sessionMetadata.availableCategoryNames.length > 0
        ? z.enum(sessionMetadata.availableCategoryNames as [string, ...string[]])
        : z.string()
    inputShape.categoryNames = z
      .array(categoryNameSchema)
      .max(5)
      .optional()
      .describe(
        `${
          sessionMetadata.availableCategoryNames.length > 0
            ? `Available categories for this agent: ${sessionMetadata.availableCategoryNames.join(", ")}.`
            : "No categories are configured for this agent."
        } Return the complete set to keep on the session after this turn. Return an empty array when none apply.`,
      )
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
  const inputSchema = z.object(inputShape) as unknown as z.ZodType<SubmitTurnSummaryInput>

  return tool({
    description: submitTurnSummaryDescription({
      includeSources: retrievedChunksRegistry !== undefined,
      includeSessionMetadata: sessionMetadata !== undefined,
    }),
    inputSchema,
    outputSchema: z.object({
      role: z.literal("system"),
      content: z.string().describe("The content of the system message."),
      // Marks an execution that recorded nothing — the provider's
      // end-of-turn guarantee ignores no-op executions and retries.
      endOfTurnNoOp: z.boolean().optional(),
    }),
    execute: async (input: SubmitTurnSummaryInput) => {
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
          await sessionMetadata.conversationAgentSessionsService.recalculateSessionMetadataFromMessages(
            {
              connectScope: sessionMetadata.connectScope,
              sessionId: sessionMetadata.sessionId,
              selectedCategoryNames: input.categoryNames ?? [],
              suggestedTitle: input.suggestedTitle ?? null,
            },
          )
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
      }
    },
  })
}
