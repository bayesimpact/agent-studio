import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ALL_ENTITIES } from "@/common/all-entities"
import { LlmModule } from "@/external/llm/llm.module"
import { EVALUATION_EXTRACTION_RUN_QUEUE_NAME } from "./evaluation-extraction-run.constants"
import { EvaluationExtractionRunWorker } from "./evaluation-extraction-run.worker"
import { EvaluationExtractionRunGraderService } from "./evaluation-extraction-run-grader.service"
import { EvaluationExtractionRunProcessorService } from "./evaluation-extraction-run-processor.service"
import { EvaluationExtractionRunStatusNotifierService } from "./evaluation-extraction-run-status-notifier.service"

@Module({
  imports: [
    BullModule.registerQueue({
      name: EVALUATION_EXTRACTION_RUN_QUEUE_NAME,
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
    LlmModule,
  ],
  providers: [
    EvaluationExtractionRunWorker,
    EvaluationExtractionRunProcessorService,
    EvaluationExtractionRunStatusNotifierService,
    EvaluationExtractionRunGraderService,
  ],
})
export class EvaluationExtractionRunWorkersModule {}
