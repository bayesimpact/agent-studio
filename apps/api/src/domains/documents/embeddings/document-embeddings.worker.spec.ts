import { DOCUMENT_EMBEDDINGS_JOB_NAME } from "./document-embeddings.constants"
import { DocumentEmbeddingsWorker } from "./document-embeddings.worker"

describe("DocumentEmbeddingsWorker", () => {
  it("logs the payload for create-embeddings jobs", async () => {
    const worker = new DocumentEmbeddingsWorker()
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})

    const job = {
      name: DOCUMENT_EMBEDDINGS_JOB_NAME,
      data: {
        documentId: "document-id",
        organizationId: "organization-id",
        projectId: "project-id",
        uploadedByUserId: "user-id",
        origin: "document-upload" as const,
        currentTraceId: "trace-id",
      },
    }

    await worker.process(job as never)

    expect(logSpy).toHaveBeenCalledWith(
      "[DocumentEmbeddingsWorker] processing create-embeddings job",
      job.data,
    )
    logSpy.mockRestore()
  })
})
