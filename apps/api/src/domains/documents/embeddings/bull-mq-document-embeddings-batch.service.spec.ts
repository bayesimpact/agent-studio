import type { Queue } from "bullmq"
import { BullMqDocumentEmbeddingsBatchService } from "./bull-mq-document-embeddings-batch.service"
import type { DocumentEmbeddingQueueSyncService } from "./document-embedding-queue-sync.service"
import { DOCUMENT_EMBEDDINGS_JOB_NAME } from "./document-embeddings.constants"

describe("BullMqDocumentEmbeddingsBatchService", () => {
  it("adds a create-embeddings job then marks document queued and notifies", async () => {
    const addJob = jest.fn().mockResolvedValue(undefined)
    const queue = { add: addJob } as unknown as Queue

    const payload = {
      documentId: "document-id",
      organizationId: "organization-id",
      projectId: "project-id",
      uploadedByUserId: "user-id",
      origin: "document-upload" as const,
      currentTraceId: "trace-id",
    }

    const afterEnqueuePatch = {
      embeddingStatus: "queued" as const,
      embeddingError: null,
      updatedAt: new Date("2026-05-04T12:00:00.000Z"),
    }
    const markDocumentAsQueuedAndNotify = jest.fn().mockResolvedValue(afterEnqueuePatch)
    const documentEmbeddingQueueSyncService = {
      markDocumentAsQueuedAndNotify,
    } as unknown as DocumentEmbeddingQueueSyncService

    const service = new BullMqDocumentEmbeddingsBatchService(
      queue,
      documentEmbeddingQueueSyncService,
    )

    const result = await service.enqueueCreateEmbeddingsForDocument(payload)

    expect(addJob).toHaveBeenCalledWith(DOCUMENT_EMBEDDINGS_JOB_NAME, payload)
    expect(markDocumentAsQueuedAndNotify).toHaveBeenCalledWith(payload)
    expect(result).toBe(afterEnqueuePatch)
  })
})
