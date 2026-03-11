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

  /**
   * Creates a new document tag for a project.
   */
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

  /**
   * Lists all document tags for a project.
   */
  async listDocumentTags(connectScope: RequiredConnectScope): Promise<DocumentTag[]> {
    return (await this.documentTagConnectRepository.getMany(connectScope))?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )
  }

  /**
   * Finds a document tag by its id.
   */
  async findDocumentTagById({
    connectScope,
    documentTagId,
  }: {
    connectScope: RequiredConnectScope
    documentTagId: string
  }): Promise<DocumentTag | null> {
    return this.documentTagConnectRepository.getOneById(connectScope, documentTagId)
  }

  /**
   * Updates a document tag.
   */
  async updateDocumentTag({
    connectScope,
    required,
    fieldsToUpdate,
  }: {
    connectScope: RequiredConnectScope
    required: { documentTagId: string }
    fieldsToUpdate: Partial<Pick<DocumentTag, "name" | "description" | "parentId">>
  }): Promise<DocumentTag> {
    const { documentTagId } = required

    const documentTag = await this.documentTagConnectRepository.getOneById(
      connectScope,
      documentTagId,
    )

    if (!documentTag) {
      throw new NotFoundException(`DocumentTag with id ${documentTagId} not found`)
    }

    Object.assign(documentTag, {
      ...(fieldsToUpdate.name !== undefined && { name: fieldsToUpdate.name }),
      ...(fieldsToUpdate.description !== undefined && { description: fieldsToUpdate.description }),
      ...(fieldsToUpdate.parentId !== undefined && { parentId: fieldsToUpdate.parentId }),
    })

    return await this.documentTagConnectRepository.saveOne(documentTag)
  }

  /**
   * Deletes a document tag.
   */
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
