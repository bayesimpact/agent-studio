import type { DocumentDto } from "@caseai-connect/api-contracts"
import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { ConnectRequiredFields } from "@/common/entities/connect-required-fields"
import { Document } from "./document.entity"

@Injectable()
export class DocumentsService {
  constructor(@InjectRepository(Document) documentRepository: Repository<Document>) {
    this.documentConnectRepository = new ConnectRepository(documentRepository, "documents")
  }
  private readonly documentConnectRepository: ConnectRepository<Document>
  async createDocumentFromFile({
    connectRequiredFields,
    documentId,
    fields,
  }: {
    connectRequiredFields: ConnectRequiredFields
    documentId: string
    fields: Pick<DocumentDto, "fileName" | "mimeType" | "size" | "storageRelativePath" | "title"> //fixme DOO : DocumentDto ???
  }): Promise<Document> {
    return await this.documentConnectRepository.createAndSave(connectRequiredFields, {
      id: documentId,
      fileName: fields.fileName,
      mimeType: fields.mimeType,
      size: fields.size,
      storageRelativePath: fields.storageRelativePath,
      title: fields.title ?? fields.fileName,
    })
  }

  async listDocuments(connectRequiredFields: ConnectRequiredFields): Promise<Document[]> {
    return (await this.documentConnectRepository.getMany(connectRequiredFields))?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
  }

  async findById({
    connectRequiredFields,
    documentId,
  }: {
    connectRequiredFields: ConnectRequiredFields
    documentId: string
  }): Promise<Document | null> {
    return await this.documentConnectRepository.getOneById(connectRequiredFields, documentId)
  }

  async deleteDocument({
    connectRequiredFields,
    documentId,
  }: {
    connectRequiredFields: ConnectRequiredFields
    documentId: string
  }): Promise<true> {
    const isDeleted = await this.documentConnectRepository.deleteOneById({
      connectRequiredFields,
      id: documentId,
    })
    if (!isDeleted) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }
    return true
  }
}
