import { PDFReader } from "@llamaindex/readers/pdf"
import { Injectable, UnsupportedMediaTypeException } from "@nestjs/common"
import mammoth from "mammoth"

@Injectable()
export class DocumentTextExtractorService {
  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === "application/pdf") {
      const reader = new PDFReader()
      const docs = await reader.loadDataAsContent(buffer)
      return docs.map((doc) => doc.text).join("\n")
    }

    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }

    if (mimeType === "text/plain" || mimeType === "text/csv") {
      return buffer.toString("utf-8")
    }

    throw new UnsupportedMediaTypeException(`Cannot extract text from MIME type: ${mimeType}`)
  }
}
