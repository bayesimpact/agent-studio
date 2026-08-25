import { execFile } from "node:child_process"
import { join } from "node:path"
import {
  type AgentModel,
  AgentModelToAgentProvider,
  AgentProvider,
} from "@caseai-connect/api-contracts"
import type { FilePart, ImagePart } from "ai"
import type { LLMChatMessage } from "@/common/interfaces/llm-provider.interface"

/** Gemma and MedGemma are image-only models: pdfs must be sent as images. */
export const modelRequiresPdfAsImages = (model: AgentModel | string): boolean => {
  const provider = AgentModelToAgentProvider[model as AgentModel]
  return provider === AgentProvider.Gemma || provider === AgentProvider.MedGemma
}

// Guards against oversized vision requests: each page becomes one image sent
// to the model, so unbounded PDFs would blow up the request payload.
export const MAX_PDF_PAGES_FOR_IMAGE_CONVERSION = 20

// A malicious or degenerate pdf can declare an arbitrarily large page size;
// rasterizing it at full scale would allocate width*height*4 bytes per page.
export const MAX_RENDERED_PIXELS_PER_PAGE = 4_000_000

// pdf.js scale 1 renders at 72dpi; 2 keeps text legible for extraction.
const PDF_RENDER_SCALE = 2

const PDF_RENDER_TIMEOUT_MS = 60_000
const PDF_RENDER_MAX_OUTPUT_BYTES = 256 * 1024 * 1024

// Rendering runs in a short-lived subprocess (a plain ESM script, ships to
// dist via the nest-cli assets rule): an untrusted pdf that crashes or hangs
// the renderer cannot take down the API/worker event loop, the child gets a
// hard timeout and heap cap, and it inherits none of the parent's env.
const RENDER_SCRIPT_PATH = join(__dirname, "pdf-pages-to-png.script.mjs")

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

function renderPdfPagesToPng(pdfBytes: Uint8Array): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      process.execPath,
      [
        "--max-old-space-size=1024",
        RENDER_SCRIPT_PATH,
        String(MAX_PDF_PAGES_FOR_IMAGE_CONVERSION),
        String(MAX_RENDERED_PIXELS_PER_PAGE),
        String(PDF_RENDER_SCALE),
      ],
      { timeout: PDF_RENDER_TIMEOUT_MS, maxBuffer: PDF_RENDER_MAX_OUTPUT_BYTES, env: {} },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            reject(new Error(`PDF rendering timed out after ${PDF_RENDER_TIMEOUT_MS}ms`))
            return
          }
          reject(new Error(stderr.trim() || `PDF rendering failed: ${error.message}`))
          return
        }
        resolve((JSON.parse(stdout) as { pages: string[] }).pages)
      },
    )
    child.stdin?.end(pdfBytes)
  })
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
