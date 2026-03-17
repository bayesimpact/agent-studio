import { PDFReader } from "@llamaindex/readers/pdf"
import { Injectable, Logger, UnsupportedMediaTypeException } from "@nestjs/common"
import mammoth from "mammoth"
import { extractTextWithDocling, isDoclingEnabled } from "@/external/docling/docling.cli"
import { DOC_MIME_TYPES, DOCLING_SUPPORTED_MIME_TYPES } from "@/external/docling/docling.constants"

const DOCLING_MAX_STDOUT_BUFFER = 50 * 1024 * 1024

@Injectable()
export class DocumentTextExtractorService {
  private readonly logger = new Logger(DocumentTextExtractorService.name)

  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === "text/plain" || mimeType === "text/csv") {
      return buffer.toString("utf-8")
    }

    if (isDoclingEnabled() && DOCLING_SUPPORTED_MIME_TYPES.has(mimeType)) {
      try {
        const extractedText = await extractTextWithDocling({
          buffer,
          mimeType,
          maxBuffer: DOCLING_MAX_STDOUT_BUFFER,
        })
        if (extractedText.trim().length > 0) {
          return extractedText
        }
      } catch (error) {
        this.logger.warn(
          `Docling extraction failed for MIME type ${mimeType}, falling back to legacy extractors.`,
        )
        this.logger.debug(
          `Docling error: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    // as a fallback, we use the PDFReader to extract the text from the PDF
    if (mimeType === "application/pdf") {
      const reader = new PDFReader()
      const docs = await reader.loadDataAsContent(buffer)
      return docs.map((documentContent) => documentContent.text).join("\n")
    }

    // as a fallback, we use mammoth to extract the text from the Microsoft document
    if (DOC_MIME_TYPES.has(mimeType)) {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }

    throw new UnsupportedMediaTypeException(`Cannot extract text from MIME type: ${mimeType}`)
  }
}
