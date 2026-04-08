import { InjectQueue } from "@nestjs/bullmq"
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common"
import type { Queue } from "bullmq"
import { DOCUMENT_EMBEDDINGS_QUEUE_NAME } from "./document-embeddings.constants"

const QUEUE_METRICS_INTERVAL_MS = 30_000

@Injectable()
export class QueueMetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueMetricsService.name)
  private intervalHandle: NodeJS.Timeout | null = null

  constructor(
    @InjectQueue(DOCUMENT_EMBEDDINGS_QUEUE_NAME)
    private readonly documentEmbeddingsQueue: Queue,
  ) {}

  onModuleInit() {
    this.intervalHandle = setInterval(() => {
      void this.logQueueMetrics()
    }, QUEUE_METRICS_INTERVAL_MS)
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
  }

  private async logQueueMetrics(): Promise<void> {
    try {
      const counts = await this.documentEmbeddingsQueue.getJobCounts()
      this.logger.log(
        `queue_metrics queue=${DOCUMENT_EMBEDDINGS_QUEUE_NAME} waiting=${counts.waiting} active=${counts.active} completed=${counts.completed} failed=${counts.failed}`,
      )
    } catch (error) {
      this.logger.error(
        `Failed to collect queue metrics: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}
