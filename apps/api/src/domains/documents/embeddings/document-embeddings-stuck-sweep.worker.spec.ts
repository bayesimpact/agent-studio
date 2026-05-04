import type { Job } from "bullmq"
import { DOCUMENT_EMBEDDINGS_STUCK_SWEEP_JOB_NAME } from "./document-embeddings-stuck.constants"
import type { DocumentEmbeddingsStuckSweepService } from "./document-embeddings-stuck-sweep.service"
import { DocumentEmbeddingsStuckSweepWorker } from "./document-embeddings-stuck-sweep.worker"

describe("DocumentEmbeddingsStuckSweepWorker", () => {
  it("runs sweep for the stuck-sweep job name", async () => {
    const sweepStuckDocuments = jest.fn().mockResolvedValue({ timedOutCount: 2 })
    const stuckSweepService = {
      sweepStuckDocuments,
    } as unknown as DocumentEmbeddingsStuckSweepService

    const worker = new DocumentEmbeddingsStuckSweepWorker(stuckSweepService)
    const job = {
      name: DOCUMENT_EMBEDDINGS_STUCK_SWEEP_JOB_NAME,
      id: "job-1",
    } as unknown as Job

    await worker.process(job)

    expect(sweepStuckDocuments).toHaveBeenCalledTimes(1)
  })

  it("ignores unknown job names", async () => {
    const sweepStuckDocuments = jest.fn()
    const stuckSweepService = {
      sweepStuckDocuments,
    } as unknown as DocumentEmbeddingsStuckSweepService

    const worker = new DocumentEmbeddingsStuckSweepWorker(stuckSweepService)
    const job = { name: "other-job", id: "job-1" } as unknown as Job

    await worker.process(job)

    expect(sweepStuckDocuments).not.toHaveBeenCalled()
  })
})
