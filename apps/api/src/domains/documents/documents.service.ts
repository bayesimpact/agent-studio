import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { Document } from "./document.entity"

@Injectable()
export class DocumentsService {
  constructor(@InjectRepository(Document) documentRepository: Repository<Document>) {
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
      })
    )?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findById({
    connectScope,
    documentId,
  }: {
    connectScope: RequiredConnectScope
    documentId: string
  }): Promise<Document | null> {
    return await this.documentConnectRepository.getOneById(connectScope, documentId)
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
