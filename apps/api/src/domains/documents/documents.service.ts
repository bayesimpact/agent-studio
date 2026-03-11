import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { In, type Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { Document } from "./document.entity"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentTag } from "./tags/document-tag.entity"

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) documentRepository: Repository<Document>,
    @InjectRepository(DocumentTag) private readonly documentTagRepository: Repository<DocumentTag>,
  ) {
    this.documentConnectRepository = new ConnectRepository(documentRepository, "documents")
  }
  private readonly documentConnectRepository: ConnectRepository<Document>
  async createDocumentFromFile({
    connectScope,
    documentId,
    fields,
  }: {
    connectScope: RequiredConnectScope
    documentId: string
    fields: Pick<
      Document,
      "fileName" | "mimeType" | "size" | "storageRelativePath" | "title" | "sourceType"
    >
  }): Promise<Document> {
    return await this.documentConnectRepository.createAndSave(connectScope, {
      id: documentId,
      fileName: fields.fileName,
      mimeType: fields.mimeType,
      size: fields.size,
      storageRelativePath: fields.storageRelativePath,
      title: fields.title ?? fields.fileName,
      sourceType: fields.sourceType,
    })
  }

  async listDocuments(connectScope: RequiredConnectScope): Promise<Document[]> {
    return (
      await this.documentConnectRepository.find(connectScope, {
        where: { sourceType: "project" },
        relations: ["tags"],
      })
    )?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findById({
    connectScope,
    documentId,
    withTags = false,
  }: {
    connectScope: RequiredConnectScope
    documentId: string
    withTags?: boolean
  }): Promise<Document | null> {
    return await this.documentConnectRepository.getOneById(
      connectScope,
      documentId,
      withTags ? { relations: ["tags"] } : undefined,
    )
  }

  async updateDocument({
    connectScope,
    documentId,
    fieldsToUpdate,
  }: {
    connectScope: RequiredConnectScope
    documentId: string
    fieldsToUpdate: Partial<Pick<Document, "title">> & {
      tagsToAdd?: DocumentTag["id"][]
      tagsToRemove?: DocumentTag["id"][]
    }
  }): Promise<Document> {
    const needsTags =
      (fieldsToUpdate.tagsToAdd !== undefined && fieldsToUpdate.tagsToAdd.length > 0) ||
      (fieldsToUpdate.tagsToRemove !== undefined && fieldsToUpdate.tagsToRemove.length > 0)

    const document = await this.documentConnectRepository.getOneById(
      connectScope,
      documentId,
      needsTags ? { relations: ["tags"] } : undefined,
    )
    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }

    if (fieldsToUpdate.title !== undefined) {
      document.title = fieldsToUpdate.title
    }

    if (needsTags) {
      const tagsToAdd = fieldsToUpdate.tagsToAdd
        ? await this.documentTagRepository.findBy({ id: In(fieldsToUpdate.tagsToAdd) })
        : []
      const tagsToRemoveIds = new Set(fieldsToUpdate.tagsToRemove ?? [])
      document.tags = [
        ...(document.tags || []).filter((tag) => !tagsToRemoveIds.has(tag.id)),
        ...tagsToAdd,
      ]
    }

    return this.documentConnectRepository.saveOne(document)
  }

  async saveOne(document: Document): Promise<Document> {
    return this.documentConnectRepository.saveOne(document)
  }

  async deleteDocument({
    connectScope,
    documentId,
  }: {
    connectScope: RequiredConnectScope
    documentId: string
  }): Promise<true> {
    const isDeleted = await this.documentConnectRepository.deleteOneById({
      connectScope,
      id: documentId,
    })
    if (!isDeleted) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }
    return true
  }
}
