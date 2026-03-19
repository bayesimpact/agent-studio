import { randomUUID } from "node:crypto"
import { NestFactory } from "@nestjs/core"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { AppModule } from "@/app.module"
import { Document } from "@/domains/documents/document.entity"
import {
  DOCUMENT_EMBEDDINGS_BATCH_SERVICE,
  type DocumentEmbeddingsBatchService,
} from "@/domains/documents/embeddings/document-embeddings-batch.interface"

type CliOptions = {
  dryRun: boolean
  limit?: number
  batchSize: number
  onlyMissingDocling: boolean
  organizationId?: string
  projectId?: string
}

export function parseCliOptions(argv: string[]): CliOptions {
  const limitArg = getOptionalArgValue(argv, "--limit")
  const batchSizeArg = getOptionalArgValue(argv, "--batch-size")

  return {
    dryRun: argv.includes("--dry-run"),
    limit: limitArg ? Number.parseInt(limitArg, 10) : undefined,
    batchSize: batchSizeArg ? Number.parseInt(batchSizeArg, 10) : 200,
    onlyMissingDocling: !argv.includes("--all-project-documents"),
    organizationId: getOptionalArgValue(argv, "--organization-id"),
    projectId: getOptionalArgValue(argv, "--project-id"),
  }
}

function getOptionalArgValue(argv: string[], argName: string): string | undefined {
  const argIndex = argv.indexOf(argName)
  if (argIndex < 0) {
    return undefined
  }

  return argv[argIndex + 1]
}

function validateCliOptions(options: CliOptions): void {
  if (options.limit !== undefined && (Number.isNaN(options.limit) || options.limit <= 0)) {
    throw new Error("Invalid --limit value. It must be a positive integer.")
  }

  if (Number.isNaN(options.batchSize) || options.batchSize <= 0) {
    throw new Error("Invalid --batch-size value. It must be a positive integer.")
  }
}

async function bootstrapCli(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2))
  validateCliOptions(options)

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
      console.log("No documents matched the requeue filters.")
      return
    }

    console.log(
      `Found ${documentsToRequeue.length} documents to ${options.dryRun ? "preview" : "requeue"}.`,
    )

    if (options.dryRun) {
      for (const document of documentsToRequeue.slice(0, 20)) {
        console.log(
          `[dry-run] ${document.id} org=${document.organizationId} project=${document.projectId} extractionEngine=${document.extractionEngine ?? "null"} embeddingStatus=${document.embeddingStatus}`,
        )
      }
      if (documentsToRequeue.length > 20) {
        console.log(
          `[dry-run] ... ${documentsToRequeue.length - 20} additional document(s) omitted`,
        )
      }
      return
    }

    let enqueuedCount = 0
    for (const documentsBatch of chunkDocuments(documentsToRequeue, options.batchSize)) {
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
      console.log(`Enqueued ${enqueuedCount}/${documentsToRequeue.length} documents`)
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

function chunkDocuments(documents: Document[], batchSize: number): Document[][] {
  const batches: Document[][] = []
  for (let index = 0; index < documents.length; index += batchSize) {
    batches.push(documents.slice(index, index + batchSize))
  }
  return batches
}

if (require.main === module) {
  void bootstrapCli()
}
