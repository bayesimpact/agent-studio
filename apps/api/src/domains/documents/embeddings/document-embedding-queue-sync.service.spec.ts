import { NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { Document } from "../document.entity"
import { DocumentEmbeddingQueueSyncService } from "./document-embedding-queue-sync.service"
import type { DocumentEmbeddingStatusNotifierService } from "./document-embedding-status-notifier.service"

describe("DocumentEmbeddingQueueSyncService", () => {
  const payload = {
    documentId: "document-id",
    organizationId: "organization-id",
    projectId: "project-id",
    uploadedByUserId: "user-id",
    origin: "document-upload" as const,
    currentTraceId: "trace-id",
  }

  it("throws when the document is not in scope", async () => {
    const getOne = jest.fn().mockResolvedValue(null)
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      getOne,
    }
    const documentRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
    } as unknown as Repository<Document>

    const notifyEmbeddingStatusChanged = jest.fn().mockResolvedValue(undefined)
    const embeddingStatusNotifierService = {
      notifyEmbeddingStatusChanged,
    } as unknown as DocumentEmbeddingStatusNotifierService

    const service = new DocumentEmbeddingQueueSyncService(
      documentRepository,
      embeddingStatusNotifierService,
    )

    await expect(service.markDocumentAsQueuedAndNotify(payload)).rejects.toThrow(NotFoundException)
    expect(documentRepository.save).not.toHaveBeenCalled()
    expect(notifyEmbeddingStatusChanged).not.toHaveBeenCalled()
  })

  it("sets status to queued, clears embedding error, saves, and notifies", async () => {
    const document = {
      id: payload.documentId,
      organizationId: payload.organizationId,
      projectId: payload.projectId,
      embeddingStatus: "failed",
      embeddingError: "previous error",
      updatedAt: new Date("2026-05-04T12:00:00.000Z"),
    } as Document

    const getOne = jest.fn().mockResolvedValue(document)
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      getOne,
    }
    const save = jest.fn().mockImplementation((entity: Document) => Promise.resolve(entity))
    const documentRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save,
    } as unknown as Repository<Document>

    const notifyEmbeddingStatusChanged = jest.fn().mockResolvedValue(undefined)
    const embeddingStatusNotifierService = {
      notifyEmbeddingStatusChanged,
    } as unknown as DocumentEmbeddingStatusNotifierService

    const service = new DocumentEmbeddingQueueSyncService(
      documentRepository,
      embeddingStatusNotifierService,
    )

    const result = await service.markDocumentAsQueuedAndNotify(payload)

    expect(document.embeddingStatus).toBe("queued")
    expect(document.embeddingError).toBeNull()
    expect(save).toHaveBeenCalledWith(document)
    expect(notifyEmbeddingStatusChanged).toHaveBeenCalledWith({
      documentId: payload.documentId,
      organizationId: payload.organizationId,
      projectId: payload.projectId,
      embeddingStatus: "queued",
      embeddingError: null,
      updatedAt: document.updatedAt.getTime(),
    })
    expect(result).toEqual({
      embeddingStatus: "queued",
      embeddingError: null,
      updatedAt: document.updatedAt,
    })
  })
})
