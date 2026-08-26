import type { FilePart, ImagePart } from "ai"
import { GoogleAuth } from "google-auth-library"
import type { LLMChatMessage } from "@/common/interfaces/llm-provider.interface"

// Re-exported so existing importers keep working until this file is removed
// (the definition now lives in agent-provider.ts, alongside the other
// AgentModel/AgentProvider mapping helpers).
export { modelRequiresPdfAsImages } from "@/external/llm/agent-provider"

// Guards against oversized vision requests: each page becomes one image sent
// to the model, so unbounded PDFs would blow up the request payload.
export const MAX_PDF_PAGES_FOR_IMAGE_CONVERSION = 20

// A malicious or degenerate pdf can declare an arbitrarily large page size;
// rasterizing it at full scale would allocate width*height*4 bytes per page.
export const MAX_RENDERED_PIXELS_PER_PAGE = 4_000_000

// pdf.js scale 1 renders at 72dpi; 2 keeps text legible for extraction.
const PDF_RENDER_SCALE = 2

const PDF_RENDER_TIMEOUT_MS = 60_000

// Cloud Run rejects HTTP/1 requests larger than 32MiB before they reach the
// pdf-renderer service (https://docs.cloud.google.com/run/quotas), so fail
// with a clear message instead of an opaque 413 from the frontend.
export const MAX_PDF_BYTES_FOR_IMAGE_CONVERSION = 32 * 1024 * 1024

// Rasterization is RAM-heavy (up to ~1GB per document), so it never runs in
// the API/worker process: it is delegated to the dedicated pdf-renderer
// service (apps/pdf-renderer), which scales independently.
const resolvePdfRendererSettings = (): { url: string } => {
  const url = process.env.PDF_RENDERER_URL
  if (!url) {
    throw new Error(
      "PDF_RENDERER_URL is not set: converting pdfs to images for Gemma and MedGemma requires the dedicated pdf-renderer service (apps/pdf-renderer)",
    )
  }
  return { url }
}

// In production the pdf-renderer is locked behind Cloud Run invoker IAM:
// requests must carry a Google ID token minted for the service URL, and
// Google rejects everything else before it reaches the container. Terraform
// sets PDF_RENDERER_AUTH=google-iam on the API and workers; locally the
// renderer runs open and no header is sent.
const GOOGLE_IAM_AUTH_MODE = "google-iam"

let googleAuth: GoogleAuth | undefined

async function buildAuthHeaders(rendererUrl: string): Promise<Record<string, string>> {
  if (process.env.PDF_RENDERER_AUTH !== GOOGLE_IAM_AUTH_MODE) {
    return {}
  }
  // The audience must be the Cloud Run service root URL, not the full path.
  const audience = new URL(rendererUrl).origin
  googleAuth ??= new GoogleAuth()
  const idTokenClient = await googleAuth.getIdTokenClient(audience)
  const idToken = await idTokenClient.idTokenProvider.fetchIdToken(audience)
  return { Authorization: `Bearer ${idToken}` }
}

const isPdfFilePart = (part: unknown): part is FilePart =>
  typeof part === "object" &&
  part !== null &&
  (part as FilePart).type === "file" &&
  (part as FilePart).mediaType === "application/pdf"

async function resolvePdfBytes(data: FilePart["data"]): Promise<Uint8Array> {
  if (data instanceof URL) {
    const response = await fetch(data)
    if (!response.ok) {
      throw new Error(`Failed to download PDF for image conversion: HTTP ${response.status}`)
    }
    return new Uint8Array(await response.arrayBuffer())
  }
  if (typeof data === "string") {
    const base64 = data.startsWith("data:") ? data.slice(data.indexOf(",") + 1) : data
    return new Uint8Array(Buffer.from(base64, "base64"))
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }
  return new Uint8Array(data)
}

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `PDF rendering failed: pdf-renderer responded with HTTP ${response.status}`
  try {
    const body = (await response.json()) as { message?: string | string[] }
    if (typeof body.message === "string") {
      return body.message
    }
    if (Array.isArray(body.message)) {
      return body.message.join(", ")
    }
  } catch {
    // Non-json error body: fall through to the generic message.
  }
  return fallback
}

async function renderPdfPagesToPng(pdfBytes: Uint8Array): Promise<string[]> {
  if (pdfBytes.length > MAX_PDF_BYTES_FOR_IMAGE_CONVERSION) {
    const sizeMb = Math.round(pdfBytes.length / 1024 / 1024)
    const limitMb = MAX_PDF_BYTES_FOR_IMAGE_CONVERSION / 1024 / 1024
    throw new Error(
      `PDF is too large to be converted to images for this model: ${sizeMb}MB exceeds the ${limitMb}MB limit`,
    )
  }
  const { url } = resolvePdfRendererSettings()
  const endpoint = new URL("render-pages", url.endsWith("/") ? url : `${url}/`)
  endpoint.searchParams.set("maxPages", String(MAX_PDF_PAGES_FOR_IMAGE_CONVERSION))
  endpoint.searchParams.set("maxPixelsPerPage", String(MAX_RENDERED_PIXELS_PER_PAGE))
  endpoint.searchParams.set("scale", String(PDF_RENDER_SCALE))
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        ...(await buildAuthHeaders(url)),
      },
      body: pdfBytes,
      signal: AbortSignal.timeout(PDF_RENDER_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(`PDF rendering timed out after ${PDF_RENDER_TIMEOUT_MS}ms`)
    }
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`PDF rendering failed: could not reach pdf-renderer at ${url}: ${reason}`)
  }
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response))
  }
  return ((await response.json()) as { pages: string[] }).pages
}

async function convertPdfPart(part: FilePart): Promise<ImagePart[]> {
  const pdfBytes = await resolvePdfBytes(part.data)
  const pngPages = await renderPdfPagesToPng(pdfBytes)
  return pngPages.map((pngBase64) => ({
    type: "image",
    image: new Uint8Array(Buffer.from(pngBase64, "base64")),
    mediaType: "image/png",
  }))
}

/**
 * Replaces every PDF file part of a message with one PNG image part per page,
 * for models (Gemma, MedGemma) that only accept images.
 */
export async function convertPdfPartsToImageParts(
  message: LLMChatMessage,
): Promise<LLMChatMessage> {
  if (!Array.isArray(message.content) || !message.content.some(isPdfFilePart)) {
    return message
  }
  const convertedContent: unknown[] = []
  for (const part of message.content) {
    if (isPdfFilePart(part)) {
      convertedContent.push(...(await convertPdfPart(part)))
    } else {
      convertedContent.push(part)
    }
  }
  return { ...message, content: convertedContent } as LLMChatMessage
}
