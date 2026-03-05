import type { Queue } from "bullmq"
import { BullMqDocumentEmbeddingsBatchService } from "./bull-mq-document-embeddings-batch.service"
import { DOCUMENT_EMBEDDINGS_JOB_NAME } from "./document-embeddings.constants"

describe("BullMqDocumentEmbeddingsBatchService", () => {
  it("adds a create-embeddings job to the queue", async () => {
    const addJob = jest.fn().mockResolvedValue(undefined)
    const queue = { add: addJob } as unknown as Queue
    const service = new BullMqDocumentEmbeddingsBatchService(queue)

    const payload = {
      documentId: "document-id",
      organizationId: "organization-id",
      projectId: "project-id",
      uploadedByUserId: "user-id",
      origin: "document-upload" as const,
      currentTraceId: "trace-id",
    }

    await service.enqueueCreateEmbeddingsForDocument(payload)

    expect(addJob).toHaveBeenCalledWith(DOCUMENT_EMBEDDINGS_JOB_NAME, payload)
  })
})
