import { InjectQueue } from "@nestjs/bullmq"
import { Injectable, Logger } from "@nestjs/common"
import type { Queue } from "bullmq"
import {
  EVALUATION_EXTRACTION_RUN_JOB_NAME,
  EVALUATION_EXTRACTION_RUN_QUEUE_NAME,
} from "./evaluation-extraction-run.constants"
import type { ExecuteEvaluationExtractionRunJobPayload } from "./evaluation-extraction-run.types"

@Injectable()
export class BullMqEvaluationExtractionRunBatchService {
  private readonly logger = new Logger(BullMqEvaluationExtractionRunBatchService.name)

  constructor(
    @InjectQueue(EVALUATION_EXTRACTION_RUN_QUEUE_NAME)
    private readonly evaluationExtractionRunQueue: Queue<ExecuteEvaluationExtractionRunJobPayload>,
  ) {}

  async enqueueExecuteRun(payload: ExecuteEvaluationExtractionRunJobPayload): Promise<void> {
    this.logger.log(`Enqueuing evaluation extraction run job ${JSON.stringify(payload)}`)
    await this.evaluationExtractionRunQueue.add(EVALUATION_EXTRACTION_RUN_JOB_NAME, payload)
  }
}
