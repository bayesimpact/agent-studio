import { randomUUID } from "node:crypto"
import { createVertex } from "@ai-sdk/google-vertex"
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import { embedMany } from "ai"
import { Document as LlamaDocument, MetadataMode, SentenceSplitter } from "llamaindex"
import { toSql } from "pgvector"
import type { DataSource } from "typeorm"
import type { Document } from "../document.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "../documents.service"
import { FILE_STORAGE_SERVICE, type IFileStorage } from "../storage/file-storage.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentEmbeddingStatusNotifierService } from "./document-embedding-status-notifier.service"
import {
  resolveEmbeddingModelNames,
  resolveMaxVertexEmbeddingBatchSize,
  resolveVertexConfig,
} from "./document-embeddings.config"
import type { CreateDocumentEmbeddingsJobPayload } from "./document-embeddings.types"
import type { DocumentExtractionEngine } from "./document-text-extractor.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentTextExtractorService } from "./document-text-extractor.service"

const DOCUMENT_EMBEDDING_CHUNK_SIZE = 1024
const DOCUMENT_EMBEDDING_CHUNK_OVERLAP = 20
const MAX_EMBEDDING_ERROR_LENGTH = 2_000

function getEmbeddingErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, MAX_EMBEDDING_ERROR_LENGTH)
}

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
      document.embeddingError = getEmbeddingErrorMessage(error)
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
    const chunks = extractionResult.chunks ?? this.splitTextForEmbeddings(extractionResult.text)
    this.logger.log(`Split document ${document.id} into ${chunks.length} chunks`)
    return {
      chunks,
      extractionEngine: extractionResult.extractionEngine,
    }
  }

  private splitTextForEmbeddings(text: string): string[] {
    const sentenceSplitter = new SentenceSplitter({
      chunkSize: DOCUMENT_EMBEDDING_CHUNK_SIZE,
      chunkOverlap: DOCUMENT_EMBEDDING_CHUNK_OVERLAP,
    })
    const rootDocument = new LlamaDocument({ text })
    return sentenceSplitter
      .getNodesFromDocuments([rootDocument])
      .map((textNode) => textNode.getContent(MetadataMode.NONE).trim())
      .filter((chunk) => chunk.length > 0)
  }

  private async generateEmbeddingsByModel(chunks: string[]): Promise<Map<string, number[][]>> {
    const { project, location } = resolveVertexConfig()
    const embeddingModelNames = resolveEmbeddingModelNames()
    const maxVertexEmbeddingBatchSize = resolveMaxVertexEmbeddingBatchSize()
    this.logger.log(
      `Creating embeddings with Vertex models [${embeddingModelNames.join(", ")}] in project ${project}, location ${location}`,
    )

    const vertexProvider = createVertex({ project, location })
    const embeddingsByModelName = new Map<string, number[][]>()
    for (const embeddingModelName of embeddingModelNames) {
      const embeddingModel = vertexProvider.textEmbeddingModel(embeddingModelName)
      const embeddings: number[][] = []

      for (
        let batchStartIndex = 0;
        batchStartIndex < chunks.length;
        batchStartIndex += maxVertexEmbeddingBatchSize
      ) {
        const chunkBatch = chunks.slice(
          batchStartIndex,
          batchStartIndex + maxVertexEmbeddingBatchSize,
        )
        const { embeddings: batchEmbeddings } = await embedMany({
          model: embeddingModel,
          values: chunkBatch,
        })
        embeddings.push(...batchEmbeddings)
      }

      embeddingsByModelName.set(embeddingModelName, embeddings)
    }
    return embeddingsByModelName
  }

  private async markDocumentStatus(
    document: Document,
    status: Document["embeddingStatus"],
  ): Promise<void> {
    document.embeddingStatus = status
    if (status === "processing" || status === "completed") {
      document.embeddingError = null
    }
    await this.saveDocumentAndNotify(document)
  }

  private async saveDocumentAndNotify(document: Document): Promise<void> {
    const savedDocument = await this.documentsService.saveOne(document)
    await this.embeddingStatusNotifierService.notifyEmbeddingStatusChanged({
      documentId: savedDocument.id,
      organizationId: savedDocument.organizationId,
      projectId: savedDocument.projectId,
      embeddingStatus: savedDocument.embeddingStatus,
      embeddingError: savedDocument.embeddingError ?? null,
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
