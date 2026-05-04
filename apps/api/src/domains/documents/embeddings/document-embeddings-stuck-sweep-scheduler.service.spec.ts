import type { Queue } from "bullmq"
import {
  DOCUMENT_EMBEDDINGS_STUCK_SWEEP_JOB_NAME,
  DOCUMENT_EMBEDDINGS_STUCK_SWEEP_SCHEDULER_ID,
} from "./document-embeddings-stuck.constants"
import { DocumentEmbeddingsStuckSweepSchedulerService } from "./document-embeddings-stuck-sweep-scheduler.service"

describe("DocumentEmbeddingsStuckSweepSchedulerService", () => {
  const thresholdKey = "DOCUMENT_EMBEDDING_STUCK_THRESHOLD_SECONDS"
  const intervalKey = "DOCUMENT_EMBEDDING_STUCK_SWEEP_INTERVAL_SECONDS"
  const originalThreshold = process.env[thresholdKey]
  const originalInterval = process.env[intervalKey]

  afterAll(() => {
    if (originalThreshold === undefined) {
      delete process.env[thresholdKey]
    } else {
      process.env[thresholdKey] = originalThreshold
    }
    if (originalInterval === undefined) {
      delete process.env[intervalKey]
    } else {
      process.env[intervalKey] = originalInterval
    }
  })

  beforeEach(() => {
    process.env[thresholdKey] = "86400"
    process.env[intervalKey] = "900"
  })

  it("upserts the repeatable stuck-sweep job", async () => {
    process.env[intervalKey] = "120"
    const upsertJobScheduler = jest.fn().mockResolvedValue(undefined)
    const stuckSweepQueue = { upsertJobScheduler } as unknown as Queue

    const scheduler = new DocumentEmbeddingsStuckSweepSchedulerService(stuckSweepQueue)
    await scheduler.onModuleInit()

    expect(upsertJobScheduler).toHaveBeenCalledWith(
      DOCUMENT_EMBEDDINGS_STUCK_SWEEP_SCHEDULER_ID,
      { every: 120_000 },
      {
        name: DOCUMENT_EMBEDDINGS_STUCK_SWEEP_JOB_NAME,
        data: {},
      },
    )
  })
})
