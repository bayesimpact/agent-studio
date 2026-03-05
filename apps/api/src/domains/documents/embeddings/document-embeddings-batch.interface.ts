import type { CreateDocumentEmbeddingsJobPayload } from "./document-embeddings.types"

export const DOCUMENT_EMBEDDINGS_BATCH_SERVICE = "DOCUMENT_EMBEDDINGS_BATCH_SERVICE"

export interface DocumentEmbeddingsBatchService {
  enqueueCreateEmbeddingsForDocument(payload: CreateDocumentEmbeddingsJobPayload): Promise<void>
}
