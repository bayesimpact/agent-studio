import { Injectable, NotFoundException } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentTagsService } from "@/domains/documents/tags/document-tags.service"
import type { ContextResolver, ResolvableRequest } from "../context-resolver.interface"
import type { EndpointRequestWithDocumentTag } from "../request.interface"
import { getRequiredConnectScope } from "../request-context.helpers"

@Injectable()
export class DocumentTagContextResolver implements ContextResolver {
  readonly resource = "documentTag" as const

  constructor(private readonly documentTagsService: DocumentTagsService) {}

  async resolve(request: ResolvableRequest): Promise<void> {
    const requestWithParams = request as ResolvableRequest & {
      params: { documentTagId?: string }
    }
    const documentTagId = requestWithParams.params?.documentTagId

    if (!documentTagId || documentTagId === ":documentTagId") throw new NotFoundException()

    const requestWithDocumentTag = request as EndpointRequestWithDocumentTag
    const documentTag =
      (await this.documentTagsService.findDocumentTagById({
        connectScope: getRequiredConnectScope(requestWithDocumentTag),
        documentTagId,
      })) ?? undefined
    if (!documentTag) throw new NotFoundException()

    requestWithDocumentTag.documentTag = documentTag
  }
}
