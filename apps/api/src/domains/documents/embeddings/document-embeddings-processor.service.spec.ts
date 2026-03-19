import type { DataSource } from "typeorm"
import type { Document } from "../document.entity"
import type { DocumentsService } from "../documents.service"
import type { IFileStorage } from "../storage/file-storage.interface"
import type { DocumentEmbeddingStatusNotifierService } from "./document-embedding-status-notifier.service"
import { DocumentEmbeddingsProcessorService } from "./document-embeddings-processor.service"
import type { DocumentTextExtractorService } from "./document-text-extractor.service"

type DocumentEmbeddingsProcessorInternals = {
  findDocumentOrThrow: (payload: Record<string, string>) => Promise<Document>
  extractDocumentChunks: (
    document: Document,
  ) => Promise<{ chunks: string[]; extractionEngine: Document["extractionEngine"] }>
  generateEmbeddingsByModel: (chunks: string[]) => Promise<Map<string, number[][]>>
  insertChunks: (params: Record<string, unknown>) => Promise<void>
  markDocumentStatus: (
    document: Document,
    status: "pending" | "processing" | "completed" | "failed",
  ) => Promise<void>
}

describe("DocumentEmbeddingsProcessorService", () => {
  it("persists extraction engine metadata before marking completed", async () => {
    const documentsService = {} as DocumentsService
    const textExtractorService = {} as DocumentTextExtractorService
    const embeddingStatusNotifierService = {} as DocumentEmbeddingStatusNotifierService
    const fileStorage = {} as IFileStorage
    const dataSource = { query: jest.fn() } as unknown as DataSource

    const service = new DocumentEmbeddingsProcessorService(
      documentsService,
      textExtractorService,
      embeddingStatusNotifierService,
      fileStorage,
      dataSource,
    )

    const document = {
      id: "document-id",
      organizationId: "organization-id",
      projectId: "project-id",
      mimeType: "application/pdf",
      storageRelativePath: "documents/path/file.pdf",
      extractionEngine: null,
    } as Document

    const statusTransitions: Array<{
      status: string
      extractionEngine: Document["extractionEngine"]
    }> = []
    const serviceInternals = service as unknown as DocumentEmbeddingsProcessorInternals

    jest.spyOn(serviceInternals, "findDocumentOrThrow").mockResolvedValue(document)
    jest.spyOn(serviceInternals, "extractDocumentChunks").mockResolvedValue({
      chunks: ["chunk content"],
      extractionEngine: "docling",
    })
    jest
      .spyOn(serviceInternals, "generateEmbeddingsByModel")
      .mockResolvedValue(new Map([["gemini-embedding-001", [[0.1, 0.2, 0.3]]]]))
    jest.spyOn(serviceInternals, "insertChunks").mockResolvedValue(undefined)
    jest.spyOn(serviceInternals, "markDocumentStatus").mockImplementation(async (doc, status) => {
      statusTransitions.push({
        status,
        extractionEngine: doc.extractionEngine,
      })
    })

    await service.processDocument({
      documentId: "document-id",
      organizationId: "organization-id",
      projectId: "project-id",
      uploadedByUserId: "user-id",
      origin: "document-upload",
      currentTraceId: "trace-id",
    })

    expect(statusTransitions).toEqual([
      { status: "processing", extractionEngine: null },
      { status: "completed", extractionEngine: "docling" },
    ])
  })
})
