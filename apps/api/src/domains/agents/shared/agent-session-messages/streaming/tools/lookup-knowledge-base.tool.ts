import { ToolName } from "@caseai-connect/api-contracts"
import { tool } from "ai"
import { z } from "zod"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type { DocumentChunkRetrievalService } from "@/domains/documents/embeddings/document-chunk-retrieval.service"
import type { ToolExecutionLog } from "./tool-execution-log"

export const DEFAULT_TOP_K = 20

/**
 * Wording is tuned for small open-weight models (Gemma class), which under-call
 * retrieval tools whenever the decision to call is left to them as a judgement.
 *
 * The framing is deliberately epistemic rather than topical: users never ask
 * "about documents", they just ask questions, and the model has no way to
 * recognise a question as document-shaped. So the description does not describe
 * what the knowledge base holds — it tells the model that the knowledge base is
 * absent from its training data and that it therefore does not know the answer.
 * That turns "should I call this?" into a default ("assume you do not know")
 * with a short, closed list of exceptions, which is a decision a small model
 * makes reliably.
 */
export const LOOKUP_KNOWLEDGE_BASE_DESCRIPTION = [
  "Look up this assistant's knowledge base and return the passages that answer a question.",
  "The knowledge base holds information that is not in your training data. You have never seen it and cannot know what it says — so you do not know the answer to the user's question, even when it feels familiar.",
  "Assume you do not know. Call this tool before replying, and answer only from the passages it returns.",
  "The only exceptions are greetings, thanks and goodbyes, and questions about what was already said in this conversation.",
].join("\n")

const lookupKnowledgeBaseInputSchema = z.object({
  conversationSummary: z
    .string()
    .default("")
    .describe(
      "One or two sentences of context from earlier in the conversation that help disambiguate the question. Leave empty on the first question.",
    ),
  query: z
    .string()
    .min(1)
    .describe(
      'The question to look up, rewritten as a standalone sentence that makes sense on its own. Resolve pronouns and shorthand ("it", "that one", "and for last year?") from the conversation, and keep the user\'s own wording and language.',
    ),
  topK: z
    .number()
    .int()
    .positive()
    .max(DEFAULT_TOP_K)
    .default(DEFAULT_TOP_K)
    .describe(`How many passages to return. Always use the default (${DEFAULT_TOP_K}).`),
})

const retrievedChunkSchema = z.object({
  chunkId: z.string(),
  documentId: z.string(),
  documentTitle: z.string(),
  documentFileName: z.string().nullable(),
  documentSourceType: z.enum(["project", "webCrawl"]),
  chunkIndex: z.number().int(),
  content: z.string(),
  distance: z.number(),
  modelName: z.string(),
  isParentChunk: z.boolean(),
})

export type LookupKnowledgeBaseExecution = {
  input: z.infer<typeof lookupKnowledgeBaseInputSchema>
  result: {
    chunkIds: string[]
    documentIds: string[]
    documentTagIds: string[]
    returnedChunkCount: number
    topK: number
  }
}

export function buildLookupKnowledgeBaseToolExecutionLog(
  execution: LookupKnowledgeBaseExecution,
): ToolExecutionLog {
  return {
    toolName: ToolName.LookupKnowledgeBase,
    arguments: {
      conversationSummary: execution.input.conversationSummary,
      query: execution.input.query,
      topK: execution.input.topK,
      documentTagIds: execution.result.documentTagIds,
      returnedChunkCount: execution.result.returnedChunkCount,
      chunkIds: execution.result.chunkIds,
      documentIds: execution.result.documentIds,
    },
  }
}

export function lookupKnowledgeBaseTool({
  connectScope,
  documentTagIds = [],
  retrievalService,
  onExecute,
}: {
  connectScope: RequiredConnectScope
  documentTagIds?: string[]
  retrievalService: DocumentChunkRetrievalService
  onExecute: (toolExecution: ToolExecutionLog) => void
}) {
  return tool({
    description: LOOKUP_KNOWLEDGE_BASE_DESCRIPTION,
    inputSchema: lookupKnowledgeBaseInputSchema,
    outputSchema: z.object({
      retrievedChunks: z.array(retrievedChunkSchema),
      retrievalMetadata: z.object({
        returnedChunkCount: z.number().int(),
        topK: z.number().int(),
      }),
    }),
    execute: async (input) => {
      const retrievedChunks = await retrievalService.retrieveTopChunks({
        connectScope,
        conversationSummary: input.conversationSummary,
        query: input.query,
        topK: input.topK,
        documentTagIds,
      })
      const documentIds = [...new Set(retrievedChunks.map((chunk) => chunk.documentId))]
      onExecute(
        buildLookupKnowledgeBaseToolExecutionLog({
          input,
          result: {
            chunkIds: retrievedChunks.map((chunk) => chunk.chunkId),
            documentIds,
            documentTagIds,
            returnedChunkCount: retrievedChunks.length,
            topK: input.topK,
          },
        }),
      )
      return {
        retrievedChunks,
        retrievalMetadata: {
          returnedChunkCount: retrievedChunks.length,
          topK: input.topK,
        },
      }
    },
  })
}
