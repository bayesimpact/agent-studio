import { AgentSessionMessagesRoutes } from "@caseai-connect/api-contracts"
import { Controller, Get, Inject, NotFoundException, Param, Res } from "@nestjs/common"
import type { Response } from "express"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { PdfPagesService } from "@/domains/documents/pdf-pages/pdf-pages.service"
import {
  FILE_STORAGE_SERVICE,
  type IFileStorage,
} from "@/domains/documents/storage/file-storage.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { AgentMessageAttachmentDocumentsService } from "./agent-message-attachment-documents.service"

/**
 * Public, unauthenticated capability endpoint (same pattern as
 * ResourceLibraryFilesController): keyed by the attachment document UUID and
 * scoped to the org/project in the path, it only ever signs derived page
 * objects under that project's own prefix. 302-redirects to a freshly signed
 * GCS URL so the LLM serving stack (vLLM fetches image_url server-side,
 * follows redirects, cannot send auth headers) can load pdf page images.
 */
@Controller()
export class AgentMessageAttachmentPdfPagesController {
  constructor(
    private readonly agentMessageAttachmentDocumentsService: AgentMessageAttachmentDocumentsService,
    private readonly pdfPagesService: PdfPagesService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
  ) {}

  @Get(AgentSessionMessagesRoutes.getAttachmentPdfPageImage.path)
  async getAttachmentPdfPageImage(
    @Param("organizationId") organizationId: string,
    @Param("projectId") projectId: string,
    @Param("attachmentDocumentId") attachmentDocumentId: string,
    @Param("pageNumber") pageNumberParam: string,
    @Res() response: Response,
  ): Promise<void> {
    const attachmentDocument = await this.agentMessageAttachmentDocumentsService.findById({
      connectScope: { organizationId, projectId },
      attachmentDocumentId,
    })
    if (!attachmentDocument || attachmentDocument.mimeType !== "application/pdf") {
      throw new NotFoundException()
    }
    const pageNumber = Number(pageNumberParam)
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      attachmentDocument.pdfPageCount === null ||
      pageNumber > attachmentDocument.pdfPageCount
    ) {
      throw new NotFoundException()
    }
    const pageObjectPath = this.pdfPagesService.pageObjectPath(
      attachmentDocument.storageRelativePath,
      pageNumber,
    )
    // Defense in depth: only sign derived paths under this project's own prefix.
    if (!pageObjectPath.startsWith(`${organizationId}/${projectId}/`)) {
      throw new NotFoundException()
    }
    const signedUrl = await this.fileStorageService.getTemporaryUrl(pageObjectPath)
    response.redirect(302, signedUrl)
  }
}
