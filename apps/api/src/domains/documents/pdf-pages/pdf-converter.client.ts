import { Injectable } from "@nestjs/common"
import { GoogleAuth } from "google-auth-library"
import { PdfPageLimitExceededError } from "./pdf-page-limit-exceeded.error"

// Guards against oversized vision requests: each page becomes one image sent
// to the model, so unbounded PDFs would blow up the request payload.
export const MAX_PDF_PAGES_FOR_IMAGE_CONVERSION = 20

// A malicious or degenerate pdf can declare an arbitrarily large page size;
// rasterizing it at full scale would allocate width*height*4 bytes per page.
export const MAX_RENDERED_PIXELS_PER_PAGE = 4_000_000

// Rendering happens once per document (cached in pdf_page_count) so a generous
// timeout is fine; the converter aborts stuck renders itself after
// PDF_CONVERTER_RENDER_TIMEOUT_MS (60s default), well within this budget.
const RENDER_REQUEST_TIMEOUT_MS = 120_000

// In production the pdf-converter is locked behind Cloud Run invoker IAM:
// requests must carry a Google ID token minted for the service URL. Terraform
// sets PDF_CONVERTER_AUTH=google-iam on the API and workers; locally the
// converter runs open and no header is sent.
const GOOGLE_IAM_AUTH_MODE = "google-iam"

// AbortSignal.timeout can fire while awaiting fetch() or later while reading
// the response body; both reject with a DOMException named TimeoutError. The
// DOMException may come from another realm (e.g. under Jest's VM sandbox), so
// match on name instead of instanceof.
const isTimeoutError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { name?: unknown }).name === "TimeoutError"

const timeoutError = (path: string): Error =>
  new Error(`pdf-converter request to /${path} timed out after ${RENDER_REQUEST_TIMEOUT_MS}ms`)

@Injectable()
export class PdfConverterClient {
  private googleAuth: GoogleAuth | undefined

  // Returns the number of pages of a PDF document without rendering it.
  async getPageCount({ sourceObject }: { sourceObject: string }): Promise<number> {
    const { pageCount } = await this.postToConverter("page-count", { sourceObject })
    return pageCount
  }

  // Renders a PDF document into individual page images.
  // Returns the number of pages rendered. Throws PdfPageLimitExceededError
  // (user-facing message) without rendering anything when the document has
  // more pages than image-only models accept.
  async generatePdfPageImages({
    sourceObject,
    outputPrefix,
  }: {
    sourceObject: string
    outputPrefix: string
  }): Promise<number> {
    const pageCount = await this.getPageCount({ sourceObject })
    if (pageCount > MAX_PDF_PAGES_FOR_IMAGE_CONVERSION) {
      throw new PdfPageLimitExceededError(pageCount, MAX_PDF_PAGES_FOR_IMAGE_CONVERSION)
    }
    const rendered = await this.postToConverter("render-document", {
      sourceObject,
      outputPrefix,
      maxPages: MAX_PDF_PAGES_FOR_IMAGE_CONVERSION,
      maxPixelsPerPage: MAX_RENDERED_PIXELS_PER_PAGE,
    })
    return rendered.pageCount
  }

  private async postToConverter(
    path: string,
    payload: Record<string, unknown>,
  ): Promise<{ pageCount: number }> {
    const converterUrl = this.resolveConverterUrl()
    const endpoint = new URL(path, converterUrl.endsWith("/") ? converterUrl : `${converterUrl}/`)
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await this.buildAuthHeaders(converterUrl)),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(RENDER_REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      if (isTimeoutError(error)) throw timeoutError(path)
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`could not reach pdf-converter at ${converterUrl}: ${reason}`)
    }
    if (!response.ok) {
      throw new Error(await this.extractErrorMessage(response))
    }
    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      if (isTimeoutError(error)) throw timeoutError(path)
      throw new Error(`pdf-converter returned a non-json response from /${path}`)
    }
    // A misconfigured PDF_CONVERTER_URL or intercepting proxy can return a 200
    // with a different shape; an undefined pageCount would pass the page-limit
    // check and silently render zero pages, so it must fail loudly here.
    const pageCount = (body as { pageCount?: unknown } | null)?.pageCount
    if (typeof pageCount !== "number" || !Number.isInteger(pageCount) || pageCount < 0) {
      throw new Error(`pdf-converter response from /${path} did not include a valid pageCount`)
    }
    return { pageCount }
  }

  private resolveConverterUrl(): string {
    const url = process.env.PDF_CONVERTER_URL
    if (!url) {
      throw new Error(
        "PDF_CONVERTER_URL is not set: converting pdfs to images for Gemma and MedGemma requires the pdf-converter service (apps/pdf-converter)",
      )
    }
    return url
  }

  private async buildAuthHeaders(converterUrl: string): Promise<Record<string, string>> {
    if (process.env.PDF_CONVERTER_AUTH !== GOOGLE_IAM_AUTH_MODE) {
      return {}
    }
    // The audience must be the Cloud Run service root URL, not the full path.
    const audience = new URL(converterUrl).origin
    this.googleAuth ??= new GoogleAuth()
    const idTokenClient = await this.googleAuth.getIdTokenClient(audience)
    const idToken = await idTokenClient.idTokenProvider.fetchIdToken(audience)
    return { Authorization: `Bearer ${idToken}` }
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    const fallback = `pdf-converter responded with HTTP ${response.status}`
    try {
      const body = (await response.json()) as { message?: string | string[] }
      if (typeof body.message === "string") return body.message
      if (Array.isArray(body.message)) return body.message.join(", ")
    } catch {
      // Non-json error body: fall through to the generic message.
    }
    return fallback
  }
}
