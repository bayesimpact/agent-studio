import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { DocumentTag } from "./document-tag.entity"

@Injectable()
export class DocumentTagsService {
  constructor(
    @InjectRepository(DocumentTag)
    documentTagRepository: Repository<DocumentTag>,
  ) {
    this.documentTagConnectRepository = new ConnectRepository(
      documentTagRepository,
      "document-tags",
    )
  }

  private readonly documentTagConnectRepository: ConnectRepository<DocumentTag>

  async createDocumentTag({
    connectScope,
    fields,
  }: {
    connectScope: RequiredConnectScope
    fields: Pick<DocumentTag, "name"> & Partial<Pick<DocumentTag, "description" | "parentId">>
  }): Promise<DocumentTag> {
    return await this.documentTagConnectRepository.createAndSave(connectScope, {
      name: fields.name,
      description: fields.description ?? null,
      parentId: fields.parentId ?? null,
    })
  }

  async listDocumentTags(connectScope: RequiredConnectScope): Promise<DocumentTag[]> {
    return (await this.documentTagConnectRepository.getMany(connectScope))?.sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }

  async findDocumentTagById({
    connectScope,
    documentTagId,
  }: {
    connectScope: RequiredConnectScope
    documentTagId: string
  }): Promise<DocumentTag | null> {
    return this.documentTagConnectRepository.getOneById(connectScope, documentTagId)
  }

  async updateDocumentTag({
    connectScope,
    documentTagId,
    fieldsToUpdate,
  }: {
    connectScope: RequiredConnectScope
    documentTagId: string
    fieldsToUpdate: Pick<DocumentTag, "name" | "description" | "parentId">
  }): Promise<DocumentTag> {
    const documentTag = await this.documentTagConnectRepository.getOneById(
      connectScope,
      documentTagId,
    )

    if (!documentTag) {
      throw new NotFoundException(`DocumentTag with id ${documentTagId} not found`)
    }

    Object.assign(documentTag, fieldsToUpdate)

    return await this.documentTagConnectRepository.saveOne(documentTag)
  }

  async deleteDocumentTag({
    connectScope,
    documentTagId,
  }: {
    connectScope: RequiredConnectScope
    documentTagId: string
  }): Promise<void> {
    const documentTag = await this.documentTagConnectRepository.getOneById(
      connectScope,
      documentTagId,
    )

    if (!documentTag) {
      throw new NotFoundException(`DocumentTag with id ${documentTagId} not found`)
    }

    await this.documentTagConnectRepository.deleteOneById({ connectScope, id: documentTag.id })
  }
}
