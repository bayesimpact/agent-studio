import type { DocumentEmbeddingStatus } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import type { DataSource } from "typeorm"
import { DOCUMENT_EMBEDDING_STATUS_CHANGED_CHANNEL } from "./document-embedding-status.constants"

@Injectable()
export class DocumentEmbeddingStatusNotifierService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async notifyEmbeddingStatusChanged(params: {
    documentId: string
    organizationId: string
    projectId: string
    embeddingStatus: DocumentEmbeddingStatus
    updatedAt: number
  }): Promise<void> {
    const payload = JSON.stringify({
      type: "document_embedding_status_changed",
      documentId: params.documentId,
      organizationId: params.organizationId,
      projectId: params.projectId,
      embeddingStatus: params.embeddingStatus,
      updatedAt: params.updatedAt,
    })
    await this.dataSource.query(`SELECT pg_notify($1, $2)`, [
      DOCUMENT_EMBEDDING_STATUS_CHANGED_CHANNEL,
      payload,
    ])
  }
}
