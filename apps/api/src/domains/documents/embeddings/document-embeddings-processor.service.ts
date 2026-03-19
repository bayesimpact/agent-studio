import { randomUUID } from "node:crypto"
import { createVertex } from "@ai-sdk/google-vertex"
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import { embedMany } from "ai"
import { SentenceSplitter } from "llamaindex"
import { toSql } from "pgvector"
import type { DataSource } from "typeorm"
import type { Document } from "../document.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "../documents.service"
import { FILE_STORAGE_SERVICE, type IFileStorage } from "../storage/file-storage.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentEmbeddingStatusNotifierService } from "./document-embedding-status-notifier.service"
import { resolveEmbeddingModelNames, resolveVertexConfig } from "./document-embeddings.config"
import type { CreateDocumentEmbeddingsJobPayload } from "./document-embeddings.types"
import type { DocumentExtractionEngine } from "./document-text-extractor.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentTextExtractorService } from "./document-text-extractor.service"

const CHUNK_SIZE = 512
const CHUNK_OVERLAP = 50

@Injectable()
export class DocumentEmbeddingsProcessorService {
  private readonly logger = new Logger(DocumentEmbeddingsProcessorService.name)

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly textExtractorService: DocumentTextExtractorService,
    private readonly embeddingStatusNotifierService: DocumentEmbeddingStatusNotifierService,
    @Inject(FILE_STORAGE_SERVICE) private readonly fileStorage: IFileStorage,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async processDocument(payload: CreateDocumentEmbeddingsJobPayload): Promise<void> {
    const document = await this.findDocumentOrThrow(payload)
    await this.markDocumentStatus(document, "processing")

    try {
      const extractionResult = await this.extractDocumentChunks(document)
      const embeddingsByModelName = await this.generateEmbeddingsByModel(extractionResult.chunks)

      await this.insertChunks({
        documentId: document.id,
        organizationId: payload.organizationId,
        projectId: payload.projectId,
        chunks: extractionResult.chunks,
        embeddingsByModelName,
      })

      document.extractionEngine = extractionResult.extractionEngine
      await this.markDocumentStatus(document, "completed")

      this.logger.log(`Embeddings created for document ${document.id}`)
    } catch (error) {
      await this.markDocumentStatus(document, "failed")
      throw error
    }
  }

  private async findDocumentOrThrow(
    payload: CreateDocumentEmbeddingsJobPayload,
  ): Promise<Document> {
    const connectScope = {
      organizationId: payload.organizationId,
      projectId: payload.projectId,
    }

    const document = await this.documentsService.findById({
      connectScope,
      documentId: payload.documentId,
    })
    if (!document) {
      throw new NotFoundException(`Document ${payload.documentId} not found`)
    }

    return document
  }

  private async extractDocumentChunks(document: Document): Promise<{
    chunks: string[]
    extractionEngine: DocumentExtractionEngine
  }> {
    const fileBuffer = await this.fileStorage.readFile(document.storageRelativePath)
    const extractionResult = await this.textExtractorService.extract(fileBuffer, document.mimeType)
    const splitter = new SentenceSplitter({ chunkSize: CHUNK_SIZE, chunkOverlap: CHUNK_OVERLAP })
    const chunks = splitter.splitText(extractionResult.text)
    this.logger.log(`Split document ${document.id} into ${chunks.length} chunks`)
    return {
      chunks,
      extractionEngine: extractionResult.extractionEngine,
    }
  }

  private async generateEmbeddingsByModel(chunks: string[]): Promise<Map<string, number[][]>> {
    const { project, location } = resolveVertexConfig()
    const embeddingModelNames = resolveEmbeddingModelNames()
    this.logger.log(
      `Creating embeddings with Vertex models [${embeddingModelNames.join(", ")}] in project ${project}, location ${location}`,
    )

    const vertexProvider = createVertex({ project, location })
    const embeddingsByModelName = new Map<string, number[][]>()
    for (const embeddingModelName of embeddingModelNames) {
      const embeddingModel = vertexProvider.textEmbeddingModel(embeddingModelName)
      const { embeddings } = await embedMany({ model: embeddingModel, values: chunks })
      embeddingsByModelName.set(embeddingModelName, embeddings)
    }
    return embeddingsByModelName
  }

  private async markDocumentStatus(
    document: Document,
    status: Document["embeddingStatus"],
  ): Promise<void> {
    document.embeddingStatus = status
    await this.saveDocumentAndNotify(document)
  }

  private async saveDocumentAndNotify(document: Document): Promise<void> {
    const savedDocument = await this.documentsService.saveOne(document)
    await this.embeddingStatusNotifierService.notifyEmbeddingStatusChanged({
      documentId: savedDocument.id,
      organizationId: savedDocument.organizationId,
      projectId: savedDocument.projectId,
      embeddingStatus: savedDocument.embeddingStatus,
      updatedAt: savedDocument.updatedAt.getTime(),
    })
  }

  private async insertChunks({
    documentId,
    organizationId,
    projectId,
    chunks,
    embeddingsByModelName,
  }: {
    documentId: string
    organizationId: string
    projectId: string
    chunks: string[]
    embeddingsByModelName: Map<string, number[][]>
  }): Promise<void> {
    // Delete any previous chunks for this document before re-inserting.
    // Embeddings are deleted by cascade from document_chunk_embedding.
    await this.dataSource.query(`DELETE FROM document_chunk WHERE document_id = $1`, [documentId])

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunkId = randomUUID()
      await this.dataSource.query(
        `INSERT INTO document_chunk (id, created_at, updated_at, organization_id, project_id, document_id, content, chunk_index)
         VALUES ($1, now(), now(), $2, $3, $4, $5, $6)`,
        [chunkId, organizationId, projectId, documentId, chunks[chunkIndex], chunkIndex],
      )

      for (const [embeddingModelName, embeddings] of embeddingsByModelName.entries()) {
        // NOTE: We need to use raw SQL here because TypeORM doesn't support vector columns (at least in the current 0.3.28 version)
        await this.dataSource.query(
          `INSERT INTO document_chunk_embedding (id, created_at, updated_at, organization_id, project_id, document_chunk_id, model_name, embedding)
           VALUES (uuid_generate_v4(), now(), now(), $1, $2, $3, $4, $5::vector)`,
          [organizationId, projectId, chunkId, embeddingModelName, toSql(embeddings[chunkIndex])],
        )
      }
    }
  }
}
