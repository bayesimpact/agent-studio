import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AppModule } from "@/app.module"
import {
  EvaluationExtractionRun,
  type EvaluationExtractionRunStatus,
} from "@/domains/evaluations/extraction/runs/evaluation-extraction-run.entity"
import {
  EVALUATION_EXTRACTION_RUN_BATCH_SERVICE,
  type EvaluationExtractionRunBatchService,
} from "@/domains/evaluations/extraction/runs/evaluation-extraction-run-batch.interface"
import { confirmDatabaseTarget } from "./script-bootstrap"
import {
  type BaseRequeueOptions,
  chunk,
  getOptionalArgValue,
  parseBaseRequeueOptions,
  validateBaseRequeueOptions,
} from "./shared/requeue-helpers"

const REQUEUEABLE_STATUSES: EvaluationExtractionRunStatus[] = ["pending", "failed"]

type CliOptions = BaseRequeueOptions & {
  statuses: EvaluationExtractionRunStatus[]
}

export function parseCliOptions(argv: string[]): CliOptions {
  const statusArg = getOptionalArgValue(argv, "--status")
  return {
    ...parseBaseRequeueOptions(argv),
    statuses: statusArg
      ? (statusArg.split(",") as EvaluationExtractionRunStatus[])
      : REQUEUEABLE_STATUSES,
  }
}

const logger = new Logger("RequeueEvaluationExtractionRuns")

function validateCliOptions(options: CliOptions): void {
  validateBaseRequeueOptions(options)

  const validStatuses: EvaluationExtractionRunStatus[] = [
    "pending",
    "running",
    "completed",
    "failed",
  ]
  for (const status of options.statuses) {
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid --status value "${status}". Valid values: ${validStatuses.join(", ")}`,
      )
    }
  }
}

async function bootstrapCli(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2))
  validateCliOptions(options)
  await confirmDatabaseTarget(logger)

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  })

  try {
    const runRepository = app.get<Repository<EvaluationExtractionRun>>(
      getRepositoryToken(EvaluationExtractionRun),
    )
    const batchService = app.get<EvaluationExtractionRunBatchService>(
      EVALUATION_EXTRACTION_RUN_BATCH_SERVICE,
    )

    const runsToRequeue = await loadRunsForRequeue({ options, runRepository })

    if (runsToRequeue.length === 0) {
      logger.log("No evaluation runs matched the requeue filters.")
      return
    }

    logger.log(`Found ${runsToRequeue.length} runs to ${options.dryRun ? "preview" : "requeue"}.`)

    if (options.dryRun) {
      for (const run of runsToRequeue.slice(0, 20)) {
        logger.log(
          `[dry-run] ${run.id} org=${run.organizationId} project=${run.projectId} status=${run.status} dataset=${run.evaluationExtractionDatasetId}`,
        )
      }
      if (runsToRequeue.length > 20) {
        logger.log(`[dry-run] ... ${runsToRequeue.length - 20} additional run(s) omitted`)
      }
      return
    }

    let enqueuedCount = 0
    for (const runsBatch of chunk(runsToRequeue, options.batchSize)) {
      for (const run of runsBatch) {
        await batchService.enqueueExecuteRun({
          runId: run.id,
          organizationId: run.organizationId,
          projectId: run.projectId,
        })
        enqueuedCount += 1
      }
      logger.log(`Enqueued ${enqueuedCount}/${runsToRequeue.length} runs`)
    }
  } finally {
    await app.close()
  }
}

async function loadRunsForRequeue({
  options,
  runRepository,
}: {
  options: CliOptions
  runRepository: Repository<EvaluationExtractionRun>
}): Promise<EvaluationExtractionRun[]> {
  const queryBuilder = runRepository
    .createQueryBuilder("run")
    .where("run.status IN (:...statuses)", { statuses: options.statuses })
    .andWhere("run.deletedAt IS NULL")
    .orderBy("run.createdAt", "ASC")

  if (options.organizationId) {
    queryBuilder.andWhere("run.organizationId = :organizationId", {
      organizationId: options.organizationId,
    })
  }

  if (options.projectId) {
    queryBuilder.andWhere("run.projectId = :projectId", {
      projectId: options.projectId,
    })
  }

  if (options.limit !== undefined) {
    queryBuilder.limit(options.limit)
  }

  return await queryBuilder.getMany()
}

if (require.main === module) {
  void bootstrapCli()
}
