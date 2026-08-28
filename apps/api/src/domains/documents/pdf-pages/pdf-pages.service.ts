import { Injectable } from "@nestjs/common"
import type { IFileStorage } from "../storage/file-storage.interface"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { PdfConverterClient } from "./pdf-converter.client"

/**
 * Rendered-pdf-pages orchestration for image-only models (Gemma, MedGemma):
 * pages live in GCS at {org}/{proj}/derived/{sourceId}/page-{n}.png, rendered
 * once by the pdf-converter service and cached via the owning row's
 * pdf_page_count column. The model fetches pages through temporary signed
 * storage URLs, so no image bytes ever transit this process.
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

  async getImageUrls({
    document: { storageRelativePath, pdfPageCount },
    onPageCountUpdate,
    fileStorageService,
  }: {
    document: { storageRelativePath: string; pdfPageCount: number | null }
    onPageCountUpdate: (pdfPageCount: number) => Promise<void>
    fileStorageService: IFileStorage
  }): Promise<string[]> {
    if (pdfPageCount === null) {
      // If the PDF page count is not known, render the document to determine it.
      pdfPageCount = await this.pdfConverterClient.generatePdfPageImages({
        sourceObject: storageRelativePath,
        outputPrefix: this.derivedPagesPrefix(storageRelativePath),
      })
      await onPageCountUpdate(pdfPageCount)
    }

    // Generate temporary URLs for each rendered page of the PDF.
    return Promise.all(
      Array.from({ length: pdfPageCount }, (_, index) => {
        const pageNumber = index + 1
        const pageObjectPath = this.pageObjectPath(storageRelativePath, pageNumber)
        return fileStorageService.getTemporaryUrl(pageObjectPath)
      }),
    )
  }
}
