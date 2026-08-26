import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import { AgentModel } from "@caseai-connect/api-contracts"
import type { FilePart, ImagePart, TextPart } from "ai"
import type { LLMChatMessage } from "@/common/interfaces/llm-provider.interface"
import {
  convertPdfPartsToImageParts,
  MAX_PDF_BYTES_FOR_IMAGE_CONVERSION,
  MAX_PDF_PAGES_FOR_IMAGE_CONVERSION,
  MAX_RENDERED_PIXELS_PER_PAGE,
  modelRequiresPdfAsImages,
} from "./pdf-to-image-parts"

const PDF_BYTES = Buffer.from("%PDF-1.4 fake test document")
const PAGE_ONE_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01])
const PAGE_TWO_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x02])

type CapturedRequest = {
  url: string
  contentType?: string
  authorization?: string
  body: Buffer
}

type StubResponse = {
  status: number
  body: string
  contentType?: string
}

const buildUserMessage = (content: LLMChatMessage["content"]): LLMChatMessage =>
  ({ role: "user", content }) as LLMChatMessage

const pdfFilePart = (data: FilePart["data"]): FilePart => ({
  type: "file",
  mediaType: "application/pdf",
  filename: "document.pdf",
  data,
})

// Stands in for the dedicated pdf-renderer service (apps/pdf-renderer): the
// client is exercised over real HTTP, capturing what it sends.
describe("convertPdfPartsToImageParts", () => {
  let server: Server
  let capturedRequests: CapturedRequest[]
  let stubResponse: StubResponse

  beforeAll(async () => {
    server = createServer((request, response) => {
      const chunks: Buffer[] = []
      request.on("data", (chunk) => chunks.push(chunk))
      request.on("end", () => {
        capturedRequests.push({
          url: request.url ?? "",
          contentType: request.headers["content-type"],
          authorization: request.headers.authorization,
          body: Buffer.concat(chunks),
        })
        response.statusCode = stubResponse.status
        response.setHeader("Content-Type", stubResponse.contentType ?? "application/json")
        response.end(stubResponse.body)
      })
    })
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  })

  beforeEach(() => {
    const { port } = server.address() as AddressInfo
    process.env.PDF_RENDERER_URL = `http://127.0.0.1:${port}`
    delete process.env.PDF_RENDERER_APIKEY
    capturedRequests = []
    stubResponse = {
      status: 201,
      body: JSON.stringify({ pages: [PAGE_ONE_PNG.toString("base64")] }),
    }
  })

  afterAll(async () => {
    delete process.env.PDF_RENDERER_URL
    delete process.env.PDF_RENDERER_APIKEY
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  })

  it("replaces the pdf file part with one image part per rendered page, preserving other parts", async () => {
    stubResponse.body = JSON.stringify({
      pages: [PAGE_ONE_PNG.toString("base64"), PAGE_TWO_PNG.toString("base64")],
    })
    const message = buildUserMessage([
      { type: "text", text: "extract the values" },
      pdfFilePart(PDF_BYTES),
    ])

    const converted = await convertPdfPartsToImageParts(message)

    const parts = converted.content as Array<TextPart | ImagePart>
    expect(parts).toHaveLength(3)
    expect(parts[0]).toEqual({ type: "text", text: "extract the values" })
    for (const [pageIndex, expectedPng] of [PAGE_ONE_PNG, PAGE_TWO_PNG].entries()) {
      const imagePart = parts[pageIndex + 1] as ImagePart
      expect(imagePart.type).toBe("image")
      expect(imagePart.mediaType).toBe("image/png")
      expect(Buffer.from(imagePart.image as Uint8Array)).toEqual(expectedPng)
    }
  })

  it("posts the raw pdf bytes with the conversion limits as query parameters", async () => {
    await convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(PDF_BYTES)]))

    expect(capturedRequests).toHaveLength(1)
    const captured = capturedRequests[0] as CapturedRequest
    const url = new URL(captured.url, "http://localhost")
    expect(url.pathname).toBe("/render-pages")
    expect(url.searchParams.get("maxPages")).toBe(String(MAX_PDF_PAGES_FOR_IMAGE_CONVERSION))
    expect(url.searchParams.get("maxPixelsPerPage")).toBe(String(MAX_RENDERED_PIXELS_PER_PAGE))
    expect(url.searchParams.get("scale")).toBe("2")
    expect(captured.contentType).toBe("application/pdf")
    expect(captured.authorization).toBeUndefined()
    expect(captured.body).toEqual(PDF_BYTES)
  })

  it("sends the bearer token when PDF_RENDERER_APIKEY is configured", async () => {
    process.env.PDF_RENDERER_APIKEY = "renderer-secret"

    await convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(PDF_BYTES)]))

    expect(capturedRequests[0]?.authorization).toBe("Bearer renderer-secret")
  })

  it("accepts pdf data provided as a base64 string", async () => {
    await convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(PDF_BYTES.toString("base64"))]))

    expect(capturedRequests[0]?.body).toEqual(PDF_BYTES)
  })

  it("accepts pdf data provided as a URL by downloading it", async () => {
    const url = new URL(`data:application/pdf;base64,${PDF_BYTES.toString("base64")}`)

    const converted = await convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(url)]))

    expect(capturedRequests[0]?.body).toEqual(PDF_BYTES)
    expect((converted.content as ImagePart[])[0]?.type).toBe("image")
  })

  it("propagates the renderer's error message, like the page limit rejection", async () => {
    const pageLimitMessage = `PDF has 21 pages, but at most ${MAX_PDF_PAGES_FOR_IMAGE_CONVERSION} pages can be converted to images`
    stubResponse = {
      status: 422,
      body: JSON.stringify({ message: pageLimitMessage, statusCode: 422 }),
    }

    await expect(
      convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(PDF_BYTES)])),
    ).rejects.toThrow(pageLimitMessage)
  })

  it("falls back to a generic error when the renderer response is not json", async () => {
    stubResponse = { status: 502, body: "Bad Gateway", contentType: "text/plain" }

    await expect(
      convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(PDF_BYTES)])),
    ).rejects.toThrow("PDF rendering failed: pdf-renderer responded with HTTP 502")
  })

  it("rejects pdfs above the request size limit without calling the renderer", async () => {
    const oversizedPdf = Buffer.alloc(MAX_PDF_BYTES_FOR_IMAGE_CONVERSION + 1)

    await expect(
      convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(oversizedPdf)])),
    ).rejects.toThrow("PDF is too large to be converted to images for this model")
    expect(capturedRequests).toHaveLength(0)
  })

  it("throws a configuration error when PDF_RENDERER_URL is not set", async () => {
    delete process.env.PDF_RENDERER_URL

    await expect(
      convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(PDF_BYTES)])),
    ).rejects.toThrow("PDF_RENDERER_URL is not set")
  })

  it("throws a reachability error when the renderer is down", async () => {
    process.env.PDF_RENDERER_URL = "http://127.0.0.1:1"

    await expect(
      convertPdfPartsToImageParts(buildUserMessage([pdfFilePart(PDF_BYTES)])),
    ).rejects.toThrow("could not reach pdf-renderer")
  })

  it("returns the message unchanged when the content has no pdf part", async () => {
    const message = buildUserMessage([
      { type: "text", text: "hello" },
      { type: "image", image: Buffer.from("not-a-real-image"), mediaType: "image/png" },
    ])

    const converted = await convertPdfPartsToImageParts(message)

    expect(converted).toBe(message)
    expect(capturedRequests).toHaveLength(0)
  })

  it("returns the message unchanged when the content is a plain string", async () => {
    const message = buildUserMessage("just text")

    const converted = await convertPdfPartsToImageParts(message)

    expect(converted).toBe(message)
    expect(capturedRequests).toHaveLength(0)
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
