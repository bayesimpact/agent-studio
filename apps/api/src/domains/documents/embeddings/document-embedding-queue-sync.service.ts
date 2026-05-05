import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { Document } from "../document.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentEmbeddingStatusNotifierService } from "./document-embedding-status-notifier.service"
import type {
  CreateDocumentEmbeddingsJobPayload,
  DocumentEmbeddingAfterEnqueuePatch,
} from "./document-embeddings.types"

@Injectable()
export class DocumentEmbeddingQueueSyncService {
  private readonly documentConnectRepository: ConnectRepository<Document>

  constructor(
    @InjectRepository(Document) documentRepository: Repository<Document>,
    private readonly embeddingStatusNotifierService: DocumentEmbeddingStatusNotifierService,
  ) {
    this.documentConnectRepository = new ConnectRepository(documentRepository, "documents")
  }

  async markDocumentAsQueuedAndNotify(
    payload: CreateDocumentEmbeddingsJobPayload,
  ): Promise<DocumentEmbeddingAfterEnqueuePatch> {
    const connectScope: RequiredConnectScope = {
      organizationId: payload.organizationId,
      projectId: payload.projectId,
    }
    const document = await this.documentConnectRepository.getOneById(
      connectScope,
      payload.documentId,
    )
    if (!document) {
      throw new NotFoundException(`Document with id ${payload.documentId} not found`)
    }
    document.embeddingStatus = "queued"
    document.embeddingError = null
    const savedDocument = await this.documentConnectRepository.saveOne(document)
    await this.embeddingStatusNotifierService.notifyEmbeddingStatusChanged({
      documentId: savedDocument.id,
      organizationId: savedDocument.organizationId,
      projectId: savedDocument.projectId,
      embeddingStatus: savedDocument.embeddingStatus,
      embeddingError: savedDocument.embeddingError ?? null,
      updatedAt: savedDocument.updatedAt.getTime(),
    })
    return {
      embeddingStatus: savedDocument.embeddingStatus,
      embeddingError: savedDocument.embeddingError ?? null,
      updatedAt: savedDocument.updatedAt,
    }
  }
}
