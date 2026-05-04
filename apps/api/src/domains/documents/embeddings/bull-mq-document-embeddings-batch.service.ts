import { InjectQueue } from "@nestjs/bullmq"
import { Injectable, Logger } from "@nestjs/common"
import type { Queue } from "bullmq"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentEmbeddingQueueSyncService } from "./document-embedding-queue-sync.service"
import {
  DOCUMENT_EMBEDDINGS_JOB_NAME,
  DOCUMENT_EMBEDDINGS_QUEUE_NAME,
} from "./document-embeddings.constants"
import type {
  CreateDocumentEmbeddingsJobPayload,
  DocumentEmbeddingAfterEnqueuePatch,
} from "./document-embeddings.types"

@Injectable()
export class BullMqDocumentEmbeddingsBatchService {
  private readonly logger = new Logger(BullMqDocumentEmbeddingsBatchService.name)

  constructor(
    @InjectQueue(DOCUMENT_EMBEDDINGS_QUEUE_NAME)
    private readonly documentEmbeddingsQueue: Queue<CreateDocumentEmbeddingsJobPayload>,
    private readonly documentEmbeddingQueueSyncService: DocumentEmbeddingQueueSyncService,
  ) {}

  async enqueueCreateEmbeddingsForDocument(
    payload: CreateDocumentEmbeddingsJobPayload,
  ): Promise<DocumentEmbeddingAfterEnqueuePatch> {
    this.logger.log(`Enqueuing document embeddings job ${JSON.stringify(payload)}`)
    await this.documentEmbeddingsQueue.add(DOCUMENT_EMBEDDINGS_JOB_NAME, payload)

    return await this.documentEmbeddingQueueSyncService.markDocumentAsQueuedAndNotify(payload)
  }
}
