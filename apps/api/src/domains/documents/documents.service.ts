import type { DocumentDto } from "@caseai-connect/api-contracts"
import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"

import type { ConnectRequiredFields } from "@/common/entities/connect-required-fields"
import { Document } from "./document.entity"

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly documentRepository: Repository<Document>,
  ) {}

  async createDocumentFromFile({
    connectRequiredFields,
    documentId,
    fields,
  }: {
    connectRequiredFields: ConnectRequiredFields
    documentId: string
    fields: Pick<DocumentDto, "fileName" | "mimeType" | "size" | "storageRelativePath" | "title">
  }): Promise<Document> {
    const document = this.documentRepository.create({
      ...connectRequiredFields,
      id: documentId,
      fileName: fields.fileName,
      mimeType: fields.mimeType,
      size: fields.size,
      storageRelativePath: fields.storageRelativePath,
      title: fields.title ?? fields.fileName,
    })
    return this.documentRepository.save(document)
  }

  async listDocuments({ projectId }: { projectId: string }): Promise<Document[]> {
    return this.documentRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    })
  }

  async findById(documentId: string): Promise<Document | null> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    })
    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }
    return document
  }

  async deleteDocument({ documentId }: { documentId: string }): Promise<true> {
    const isUpdated = await this.documentRepository.softDelete({ id: documentId })
    if (isUpdated.affected === 0) {
      throw new NotFoundException(`Document with id ${documentId} not found`)
    }
    return true
  }
}
