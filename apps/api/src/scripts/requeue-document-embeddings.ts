import { randomUUID } from "node:crypto"
import { Logger } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AppModule } from "@/app.module"
import { Document } from "@/domains/documents/document.entity"
import {
  DOCUMENT_EMBEDDINGS_BATCH_SERVICE,
  type DocumentEmbeddingsBatchService,
} from "@/domains/documents/embeddings/document-embeddings-batch.interface"
import { confirmDatabaseTarget } from "@/scripts/script-bootstrap"
import {
  type BaseRequeueOptions,
  chunk,
  parseBaseRequeueOptions,
  validateBaseRequeueOptions,
} from "./shared/requeue-helpers"

type CliOptions = BaseRequeueOptions & {
  onlyMissingDocling: boolean
}

export function parseCliOptions(argv: string[]): CliOptions {
  return {
    ...parseBaseRequeueOptions(argv),
    onlyMissingDocling: !argv.includes("--all-project-documents"),
  }
}

const logger = new Logger("RequeueDocumentEmbeddings")

function validateCliOptions(options: CliOptions): void {
  validateBaseRequeueOptions(options)
}

async function bootstrapCli(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2))
  validateCliOptions(options)
  await confirmDatabaseTarget(logger)

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  })

  try {
    const documentRepository = app.get<Repository<Document>>(getRepositoryToken(Document))
    const embeddingsBatchService = app.get<DocumentEmbeddingsBatchService>(
      DOCUMENT_EMBEDDINGS_BATCH_SERVICE,
    )

    const documentsToRequeue = await loadDocumentsForRequeue({
      options,
      documentRepository,
    })

    if (documentsToRequeue.length === 0) {
      logger.log("No documents matched the requeue filters.")
      return
    }

    logger.log(
      `Found ${documentsToRequeue.length} documents to ${options.dryRun ? "preview" : "requeue"}.`,
    )

    if (options.dryRun) {
      for (const document of documentsToRequeue.slice(0, 20)) {
        logger.log(
          `[dry-run] ${document.id} org=${document.organizationId} project=${document.projectId} extractionEngine=${document.extractionEngine ?? "null"} embeddingStatus=${document.embeddingStatus}`,
        )
      }
      if (documentsToRequeue.length > 20) {
        logger.log(`[dry-run] ... ${documentsToRequeue.length - 20} additional document(s) omitted`)
      }
      return
    }

    let enqueuedCount = 0
    for (const documentsBatch of chunk(documentsToRequeue, options.batchSize)) {
      for (const document of documentsBatch) {
        await embeddingsBatchService.enqueueCreateEmbeddingsForDocument({
          documentId: document.id,
          organizationId: document.organizationId,
          projectId: document.projectId,
          uploadedByUserId: "system-backfill",
          origin: "document-upload",
          currentTraceId: randomUUID(),
        })
        enqueuedCount += 1
      }
      logger.log(`Enqueued ${enqueuedCount}/${documentsToRequeue.length} documents`)
    }
  } finally {
    await app.close()
  }
}

async function loadDocumentsForRequeue({
  options,
  documentRepository,
}: {
  options: CliOptions
  documentRepository: Repository<Document>
}): Promise<Document[]> {
  const queryBuilder = documentRepository
    .createQueryBuilder("document")
    .where("document.sourceType = :sourceType", { sourceType: "project" })
    .andWhere("document.uploadStatus = :uploadStatus", { uploadStatus: "uploaded" })
    .andWhere("document.deletedAt IS NULL")
    .orderBy("document.createdAt", "ASC")

  if (options.onlyMissingDocling) {
    queryBuilder.andWhere("document.extractionEngine IS NULL")
  }

  if (options.organizationId) {
    queryBuilder.andWhere("document.organizationId = :organizationId", {
      organizationId: options.organizationId,
    })
  }

  if (options.projectId) {
    queryBuilder.andWhere("document.projectId = :projectId", {
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
