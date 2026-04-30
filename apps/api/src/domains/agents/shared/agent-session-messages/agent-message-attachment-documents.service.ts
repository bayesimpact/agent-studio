import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { ConnectRepository } from "@/common/entities/connect-repository"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { AgentMessageAttachmentDocument } from "./agent-message-attachment-document.entity"

export type CreateAgentMessageAttachmentDocumentFields = {
  fileName: string
  mimeType: string
  size: number
  storageRelativePath: string
}

@Injectable()
export class AgentMessageAttachmentDocumentsService {
  private readonly attachmentDocumentConnectRepository: ConnectRepository<AgentMessageAttachmentDocument>

  constructor(
    @InjectRepository(AgentMessageAttachmentDocument)
    attachmentDocumentRepository: Repository<AgentMessageAttachmentDocument>,
  ) {
    this.attachmentDocumentConnectRepository = new ConnectRepository(
      attachmentDocumentRepository,
      "agentMessageAttachmentDocument",
    )
  }

  async createAttachmentDocument({
    attachmentDocumentId,
    connectScope,
    fields,
  }: {
    attachmentDocumentId: string
    connectScope: RequiredConnectScope
    fields: CreateAgentMessageAttachmentDocumentFields
  }): Promise<AgentMessageAttachmentDocument> {
    return this.attachmentDocumentConnectRepository.createAndSave(connectScope, {
      id: attachmentDocumentId,
      ...fields,
    })
  }

  async findById({
    attachmentDocumentId,
    connectScope,
  }: {
    attachmentDocumentId: string
    connectScope: RequiredConnectScope
  }): Promise<AgentMessageAttachmentDocument | null> {
    return this.attachmentDocumentConnectRepository.getOneById(connectScope, attachmentDocumentId)
  }
}
