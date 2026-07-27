import { InjectQueue } from "@nestjs/bullmq"
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common"
import type { Queue } from "bullmq"
import {
  getConversationRetentionSweepCronPattern,
  getConversationRetentionSweepIntervalSeconds,
} from "./conversation-retention.config"
import {
  CONVERSATION_RETENTION_SWEEP_JOB_NAME,
  CONVERSATION_RETENTION_SWEEP_QUEUE_NAME,
  CONVERSATION_RETENTION_SWEEP_SCHEDULER_ID,
} from "./conversation-retention.constants"

@Injectable()
export class ConversationRetentionSweepSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ConversationRetentionSweepSchedulerService.name)

  constructor(
    @InjectQueue(CONVERSATION_RETENTION_SWEEP_QUEUE_NAME)
    private readonly retentionSweepQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    const cronPattern = getConversationRetentionSweepCronPattern()
    const sweepIntervalSeconds = getConversationRetentionSweepIntervalSeconds()

    await this.retentionSweepQueue.upsertJobScheduler(
      CONVERSATION_RETENTION_SWEEP_SCHEDULER_ID,
      cronPattern ? { pattern: cronPattern } : { every: sweepIntervalSeconds * 1000 },
      {
        name: CONVERSATION_RETENTION_SWEEP_JOB_NAME,
        data: {},
      },
    )

    this.logger.log(
      cronPattern
        ? `Registered conversation retention sweep scheduler (cron "${cronPattern}", queue ${CONVERSATION_RETENTION_SWEEP_QUEUE_NAME}).`
        : `Registered conversation retention sweep scheduler (every ${sweepIntervalSeconds} s, queue ${CONVERSATION_RETENTION_SWEEP_QUEUE_NAME}).`,
    )
  }
}
