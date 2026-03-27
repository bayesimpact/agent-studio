import { PDFReader } from "@llamaindex/readers/pdf"
import { Injectable, UnsupportedMediaTypeException } from "@nestjs/common"
import mammoth from "mammoth"
import {
  type DoclingChunk,
  extractTextWithDocling,
  getDoclingVersion,
  isDoclingEnabled,
} from "@/external/docling/docling.cli"
import { DOC_MIME_TYPES, DOCLING_SUPPORTED_MIME_TYPES } from "@/external/docling/docling.constants"

const DOCLING_MAX_STDOUT_BUFFER = 50 * 1024 * 1024

export type DocumentExtractionEngine = string | null

export type DocumentTextExtractionResult = {
  text: string
  chunks?: string[]
  extractionEngine: DocumentExtractionEngine
}

@Injectable()
export class DocumentTextExtractorService {
  async extract(buffer: Buffer, mimeType: string): Promise<DocumentTextExtractionResult> {
    if (mimeType === "text/plain" || mimeType === "text/csv") {
      return {
        text: buffer.toString("utf-8"),
        extractionEngine: null,
      }
    }

    if (isDoclingEnabled() && DOCLING_SUPPORTED_MIME_TYPES.has(mimeType)) {
      const doclingVersion = await getDoclingVersion()
      const doclingChunks: DoclingChunk[] = await extractTextWithDocling({
        buffer,
        mimeType,
        maxBuffer: DOCLING_MAX_STDOUT_BUFFER,
      })

      const embedTexts = doclingChunks
        .map((chunk) => chunk.embed_text)
        .map((text) => text.trim())
        .filter((text) => text.length > 0)

      if (embedTexts.length === 0) {
        throw new Error(`Docling produced no embed_text chunks for MIME type: ${mimeType}`)
      }

      return {
        text: embedTexts.join("\n"),
        chunks: embedTexts,
        extractionEngine: `docling@${doclingVersion}`,
      }
    }

    // as a fallback, we use the PDFReader to extract the text from the PDF
    if (mimeType === "application/pdf") {
      const reader = new PDFReader()
      const docs = await reader.loadDataAsContent(buffer)
      return {
        text: docs.map((documentContent) => documentContent.text).join("\n"),
        extractionEngine: null,
      }
    }

    // as a fallback, we use mammoth to extract the text from the Microsoft document
    if (DOC_MIME_TYPES.has(mimeType)) {
      const result = await mammoth.extractRawText({ buffer })
      return {
        text: result.value,
        extractionEngine: null,
      }
    }

    throw new UnsupportedMediaTypeException(`Cannot extract text from MIME type: ${mimeType}`)
  }
}
