import { DocumentsRoutes } from "@caseai-connect/api-contracts"
import { Controller, Get, Inject, NotFoundException, Param, Res } from "@nestjs/common"
import type { Response } from "express"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { DocumentsService } from "./documents.service"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { PdfPagesService } from "./pdf-pages/pdf-pages.service"
import { FILE_STORAGE_SERVICE, type IFileStorage } from "./storage/file-storage.interface"

/**
 * Public, unauthenticated capability endpoint (same pattern as
 * ResourceLibraryFilesController): keyed by the document UUID and scoped to
 * the org/project in the path, it only ever signs derived page objects under
 * that project's own prefix. 302-redirects to a freshly signed GCS URL so the
 * LLM serving stack (vLLM fetches image_url server-side, follows redirects,
 * cannot send auth headers) can load pdf page images.
 */
@Controller()
export class DocumentPdfPagesController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfPagesService: PdfPagesService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorage,
  ) {}

  @Get(DocumentsRoutes.getPdfPageImage.path)
  async getPdfPageImage(
    @Param("organizationId") organizationId: string,
    @Param("projectId") projectId: string,
    @Param("documentId") documentId: string,
    @Param("pageNumber") pageNumberParam: string,
    @Res() response: Response,
  ): Promise<void> {
    const document = await this.documentsService.findById({
      connectScope: { organizationId, projectId },
      documentId,
    })
    if (!document || document.mimeType !== "application/pdf") {
      throw new NotFoundException()
    }
    const pageNumber = Number(pageNumberParam)
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      document.pdfPageCount === null ||
      pageNumber > document.pdfPageCount
    ) {
      throw new NotFoundException()
    }
    const pageObjectPath = this.pdfPagesService.pageObjectPath(
      document.storageRelativePath,
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
