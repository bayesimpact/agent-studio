import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { AgentModel } from "@caseai-connect/api-contracts"
import type { FilePart, ImagePart, TextPart } from "ai"
import type { LLMChatMessage } from "@/common/interfaces/llm-provider.interface"
import {
  convertPdfPartsToImageParts,
  MAX_PDF_PAGES_FOR_IMAGE_CONVERSION,
  MAX_RENDERED_PIXELS_PER_PAGE,
  modelRequiresPdfAsImages,
} from "./pdf-to-image-parts"

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])

const loadTestPdf = () => readFile(join(__dirname, "providers", "files", "test-pdf.pdf"))

const buildUserMessage = (content: LLMChatMessage["content"]): LLMChatMessage =>
  ({ role: "user", content }) as LLMChatMessage

/** Builds a minimal but valid PDF containing `pageCount` empty pages. */
function buildPdfWithPages(pageCount: number, pageSize = 200): Buffer {
  const kids = Array.from({ length: pageCount }, (_, pageIndex) => `${pageIndex + 3} 0 R`).join(" ")
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    `2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`,
  ]
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    objects.push(
      `${pageIndex + 3} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageSize} ${pageSize}] >>\nendobj\n`,
    )
  }
  let body = "%PDF-1.4\n"
  const offsets: number[] = []
  for (const object of objects) {
    offsets.push(body.length)
    body += object
  }
  const xrefOffset = body.length
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return Buffer.from(body + xref + trailer, "latin1")
}

const pdfFilePart = (data: FilePart["data"]): FilePart => ({
  type: "file",
  mediaType: "application/pdf",
  filename: "document.pdf",
  data,
})

describe("convertPdfPartsToImageParts", () => {
  it("converts a single-page pdf file part into one png image part, preserving other parts", async () => {
    const pdfBuffer = await loadTestPdf()
    const message = buildUserMessage([
      { type: "text", text: "extract the values" },
      pdfFilePart(pdfBuffer),
    ])

    const converted = await convertPdfPartsToImageParts(message)

    const parts = converted.content as Array<TextPart | ImagePart>
    expect(parts).toHaveLength(2)
    expect(parts[0]).toEqual({ type: "text", text: "extract the values" })
    const imagePart = parts[1] as ImagePart
    expect(imagePart.type).toBe("image")
    expect(imagePart.mediaType).toBe("image/png")
    const imageBuffer = Buffer.from(imagePart.image as Uint8Array)
    expect(imageBuffer.subarray(0, 4)).toEqual(PNG_MAGIC)
  })

  it("converts each page of a multi-page pdf into its own image part", async () => {
    const message = buildUserMessage([pdfFilePart(buildPdfWithPages(3))])

    const converted = await convertPdfPartsToImageParts(message)

    const parts = converted.content as ImagePart[]
    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(part.type).toBe("image")
      expect(part.mediaType).toBe("image/png")
    }
  })

  it("throws when the pdf has more pages than the conversion limit", async () => {
    const tooManyPages = MAX_PDF_PAGES_FOR_IMAGE_CONVERSION + 1
    const message = buildUserMessage([pdfFilePart(buildPdfWithPages(tooManyPages))])

    await expect(convertPdfPartsToImageParts(message)).rejects.toThrow(
      `PDF has ${tooManyPages} pages, but at most ${MAX_PDF_PAGES_FOR_IMAGE_CONVERSION} pages can be converted to images`,
    )
  })

  it("accepts pdf data provided as a base64 string", async () => {
    const pdfBuffer = await loadTestPdf()
    const message = buildUserMessage([pdfFilePart(pdfBuffer.toString("base64"))])

    const converted = await convertPdfPartsToImageParts(message)

    const parts = converted.content as ImagePart[]
    expect(parts).toHaveLength(1)
    expect(parts[0]?.type).toBe("image")
  })

  it("accepts pdf data provided as a URL by downloading it", async () => {
    const pdfBuffer = await loadTestPdf()
    const url = new URL(`data:application/pdf;base64,${pdfBuffer.toString("base64")}`)
    const message = buildUserMessage([pdfFilePart(url)])

    const converted = await convertPdfPartsToImageParts(message)

    const parts = converted.content as ImagePart[]
    expect(parts).toHaveLength(1)
    expect(parts[0]?.type).toBe("image")
  })

  it("clamps the rendered size of oversized pages to the pixel budget", async () => {
    const hugePageSize = 3000
    const message = buildUserMessage([pdfFilePart(buildPdfWithPages(1, hugePageSize))])

    const converted = await convertPdfPartsToImageParts(message)

    const [imagePart] = converted.content as ImagePart[]
    const pngBuffer = Buffer.from(imagePart?.image as Uint8Array)
    const widthPx = pngBuffer.readUInt32BE(16)
    const heightPx = pngBuffer.readUInt32BE(20)
    expect(widthPx * heightPx).toBeLessThanOrEqual(MAX_RENDERED_PIXELS_PER_PAGE)
    expect(widthPx).toBeGreaterThan(hugePageSize / 2)
  })

  it("returns the message unchanged when the content has no pdf part", async () => {
    const message = buildUserMessage([
      { type: "text", text: "hello" },
      { type: "image", image: Buffer.from("not-a-real-image"), mediaType: "image/png" },
    ])

    const converted = await convertPdfPartsToImageParts(message)

    expect(converted).toBe(message)
  })

  it("returns the message unchanged when the content is a plain string", async () => {
    const message = buildUserMessage("just text")

    const converted = await convertPdfPartsToImageParts(message)

    expect(converted).toBe(message)
  })
})

describe("modelRequiresPdfAsImages", () => {
  it("is true for Gemma and MedGemma models, which only accept images", () => {
    expect(modelRequiresPdfAsImages(AgentModel.Gemma4_26B)).toBe(true)
    expect(modelRequiresPdfAsImages(AgentModel.MedGemma10_27B)).toBe(true)
  })

  it("is false for models with native pdf support or without image support", () => {
    expect(modelRequiresPdfAsImages(AgentModel.MistralSmall31_24B)).toBe(false)
  })
})
