import { ToolName } from "@caseai-connect/api-contracts"
import { Logger } from "@nestjs/common"
import { tool } from "ai"
import { z } from "zod"
import type { RetrievedPassage, RetrievedPassageRegistry } from "./retrieved-passage-registry"
import type { ToolExecutionLog } from "./tool-execution-log"

const logger = new Logger("SourcesTool")

/**
 * Maximum characters of a passage stored on the tool call and shown to the user.
 * Passages are whole chunks — a parent chunk can be several thousand characters —
 * and every cited one is persisted on the assistant message, so the excerpt is
 * capped rather than copied wholesale.
 */
const MAX_EXCERPT_LENGTH = 1_200

/** One document, with the passages of that document the answer relied on. */
type SourceDocument = {
  documentId: string
  documentTitle: string
  documentSourceType: string
  chunks: { chunkId: string; partialContent: string }[]
}

export const SOURCES_DESCRIPTION = [
  `Show the user which ${ToolName.LookupKnowledgeBase} passages your answer relies on.`,
  "Pass only the ref numbers of the passages you are using — titles, documents and quotes are attached for you.",
  "Call it as soon as you know which passages you will use, before writing your answer.",
].join("\n")

const sourcesInputSchema = z.object({
  refs: z
    .array(z.number().int().positive())
    .min(1)
    .describe("Ref numbers of the passages you used to answer, for example [1, 4]."),
})

/**
 * Records the sources behind an answer.
 *
 * Internal tool: it produces no information the model can act on, so it takes the
 * bare minimum (a list of refs) and rebuilds the payload the UI needs — document
 * ids, titles, source types and verbatim excerpts — from the passages the lookup
 * tool actually returned. Refs the model invents are dropped instead of being
 * persisted as broken sources.
 *
 * It is also a terminal tool (see `buildToolLoopStopConditions`): calling it ends
 * the turn, so its output only has to satisfy the SDK, not the model.
 */
export function sourcesTool({
  passageRegistry,
  onExecute,
}: {
  passageRegistry: RetrievedPassageRegistry
  onExecute: (toolExecution: ToolExecutionLog) => void
}) {
  return tool({
    description: SOURCES_DESCRIPTION,
    inputSchema: sourcesInputSchema,
    outputSchema: z.object({
      shownSourceCount: z.number().int().describe("How many documents were shown to the user."),
      nextStep: z.string(),
    }),
    execute: async (input, _options) => {
      const { passages, unknownRefs } = passageRegistry.resolve(input.refs)
      if (unknownRefs.length > 0) {
        logger.warn(
          `Ignoring ${unknownRefs.length} source ref(s) that no passage was retrieved for: ${unknownRefs.join(", ")}`,
        )
      }

      const sources = groupPassagesByDocument(passages)
      // No resolvable ref means there is nothing truthful to show: skip the log
      // entirely rather than surfacing an empty sources panel to the user.
      if (sources.length > 0) {
        onExecute({ toolName: ToolName.Sources, arguments: { sources } })
      }

      return {
        shownSourceCount: sources.length,
        // Read only by models that cite before answering — the ones that cite
        // alongside their answer end the turn here (terminal tool). It has to
        // cover both cases: keep going if the answer is still owed, stay silent
        // about the tool either way.
        nextStep:
          "The sources are displayed to the user. Never mention this tool or the ref numbers. If you have not answered the question yet, answer it now.",
      }
    },
  })
}

function groupPassagesByDocument(passages: RetrievedPassage[]): SourceDocument[] {
  const sourcesByDocumentId = new Map<string, SourceDocument>()

  for (const passage of passages) {
    const source = sourcesByDocumentId.get(passage.documentId) ?? {
      documentId: passage.documentId,
      documentTitle: passage.documentTitle,
      documentSourceType: passage.documentSourceType,
      chunks: [],
    }
    source.chunks.push({
      chunkId: passage.chunkId,
      partialContent: truncateExcerpt(passage.content),
    })
    sourcesByDocumentId.set(passage.documentId, source)
  }

  return [...sourcesByDocumentId.values()]
}

function truncateExcerpt(content: string): string {
  const trimmed = content.trim()
  return trimmed.length > MAX_EXCERPT_LENGTH
    ? `${trimmed.slice(0, MAX_EXCERPT_LENGTH)} […]`
    : trimmed
}
