import { tool } from "ai"
import { z } from "zod"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import type {
  DocumentChunkRetrievalService,
  RetrievedDocumentChunk,
} from "@/domains/documents/embeddings/document-chunk-retrieval.service"

const retrieveProjectDocumentChunksInputSchema = z.object({
  conversationSummary: z
    .string()
    .min(1)
    .describe("Short summary of the conversation so far, including relevant context."),
  latestUserQuestion: z
    .string()
    .min(1)
    .describe("The latest user question that must be answered with project documents."),
  topK: z
    .number()
    .int()
    .positive()
    .max(10)
    .default(3)
    .describe("How many chunks to return. Default is 3."),
})

const retrievedChunkSchema = z.object({
  chunkId: z.string(),
  documentId: z.string(),
  documentTitle: z.string(),
  documentFileName: z.string().nullable(),
  chunkIndex: z.number().int(),
  content: z.string(),
  distance: z.number(),
  modelName: z.string(),
})

export function retrieveProjectDocumentChunksTool({
  connectScope,
  retrievalService,
  onExecute,
}: {
  connectScope: RequiredConnectScope
  retrievalService: DocumentChunkRetrievalService
  onExecute: (retrievedChunks: RetrievedDocumentChunk[]) => void
}) {
  return tool({
    description:
      "Retrieve the most relevant project document chunks for the current conversation context and latest user question.",
    inputSchema: retrieveProjectDocumentChunksInputSchema,
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
        latestUserQuestion: input.latestUserQuestion,
        topK: input.topK,
      })
      onExecute(retrievedChunks)
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
