import { AgentSessionMessagesRoutes, DocumentsRoutes } from "@caseai-connect/api-contracts"
import { Injectable } from "@nestjs/common"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { PdfConverterClient } from "./pdf-converter.client"

/**
 * Rendered-pdf-pages orchestration for image-only models (Gemma, MedGemma):
 * pages live in GCS at {org}/{proj}/derived/{sourceId}/page-{n}.png, rendered
 * once by the pdf-converter service and cached via the owning row's
 * pdf_page_count column. The model fetches pages through the public
 * pdf-pages redirect endpoints, so no image bytes ever transit this process.
 */
@Injectable()
export class PdfPagesService {
  constructor(private readonly pdfConverterClient: PdfConverterClient) {}

  derivedPagesPrefix(storageRelativePath: string): string {
    const lastSlashIndex = storageRelativePath.lastIndexOf("/")
    const directory = storageRelativePath.slice(0, lastSlashIndex)
    const baseName = storageRelativePath.slice(lastSlashIndex + 1).replace(/\.[^.]+$/, "")
    return `${directory}/derived/${baseName}/`
  }

  pageObjectPath(storageRelativePath: string, pageNumber: number): string {
    return `${this.derivedPagesPrefix(storageRelativePath)}page-${pageNumber}.png`
  }

  async ensureRenderedPages({
    storageRelativePath,
    cachedPageCount,
  }: {
    storageRelativePath: string
    cachedPageCount: number | null
  }): Promise<number> {
    if (cachedPageCount !== null) return cachedPageCount
    return this.pdfConverterClient.renderDocument({
      sourceObject: storageRelativePath,
      outputPrefix: this.derivedPagesPrefix(storageRelativePath),
    })
  }

  buildAttachmentPageImageUrl({
    organizationId,
    projectId,
    attachmentDocumentId,
    pageNumber,
  }: {
    organizationId: string
    projectId: string
    attachmentDocumentId: string
    pageNumber: number
  }): URL {
    return this.stableUrl(
      AgentSessionMessagesRoutes.getAttachmentPdfPageImage.getPath({
        organizationId,
        projectId,
        attachmentDocumentId,
        pageNumber: String(pageNumber),
      }),
    )
  }

  buildDocumentPageImageUrl({
    organizationId,
    projectId,
    documentId,
    pageNumber,
  }: {
    organizationId: string
    projectId: string
    documentId: string
    pageNumber: number
  }): URL {
    return this.stableUrl(
      DocumentsRoutes.getPdfPageImage.getPath({
        organizationId,
        projectId,
        documentId,
        pageNumber: String(pageNumber),
      }),
    )
  }

  private stableUrl(routePath: string): URL {
    const baseUrl = process.env.API_PUBLIC_BASE_URL
    if (!baseUrl) {
      throw new Error(
        "API_PUBLIC_BASE_URL is not set: it is required to build the pdf page image urls the LLM serving stack fetches",
      )
    }
    // Route paths are normalized with a leading slash by defineRoute.
    return new URL(`${baseUrl.replace(/\/+$/, "")}${routePath}`)
  }
}
