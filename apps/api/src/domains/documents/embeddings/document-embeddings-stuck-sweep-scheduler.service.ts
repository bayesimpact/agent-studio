import { InjectQueue } from "@nestjs/bullmq"
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common"
import type { Queue } from "bullmq"
import {
  getDocumentEmbeddingStuckSweepIntervalSeconds,
  getDocumentEmbeddingStuckThresholdSeconds,
} from "./document-embeddings-stuck.config"
import {
  DOCUMENT_EMBEDDINGS_STUCK_SWEEP_JOB_NAME,
  DOCUMENT_EMBEDDINGS_STUCK_SWEEP_QUEUE_NAME,
  DOCUMENT_EMBEDDINGS_STUCK_SWEEP_SCHEDULER_ID,
} from "./document-embeddings-stuck.constants"

@Injectable()
export class DocumentEmbeddingsStuckSweepSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(DocumentEmbeddingsStuckSweepSchedulerService.name)

  constructor(
    @InjectQueue(DOCUMENT_EMBEDDINGS_STUCK_SWEEP_QUEUE_NAME)
    private readonly stuckSweepQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    getDocumentEmbeddingStuckThresholdSeconds()
    const sweepIntervalSeconds = getDocumentEmbeddingStuckSweepIntervalSeconds()
    const sweepIntervalMs = sweepIntervalSeconds * 1000

    await this.stuckSweepQueue.upsertJobScheduler(
      DOCUMENT_EMBEDDINGS_STUCK_SWEEP_SCHEDULER_ID,
      { every: sweepIntervalMs },
      {
        name: DOCUMENT_EMBEDDINGS_STUCK_SWEEP_JOB_NAME,
        data: {},
      },
    )

    this.logger.log(
      `Registered stuck embedding sweep scheduler (every ${sweepIntervalSeconds} s, queue ${DOCUMENT_EMBEDDINGS_STUCK_SWEEP_QUEUE_NAME}).`,
    )
  }
}
