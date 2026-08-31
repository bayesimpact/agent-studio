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

@Injectable()
export class PdfConverterClient {
  private googleAuth: GoogleAuth | undefined

  // Renders a PDF document into individual page images.
  // Returns the number of pages rendered. Throws PdfPageLimitExceededError
  // (user-facing message) when the document has more pages than image-only
  // models accept: the converter counts pages first and rejects with a 422
  // before rendering anything.
  async generatePdfPageImages({
    sourceObject,
    outputPrefix,
  }: {
    sourceObject: string
    outputPrefix: string
  }): Promise<number> {
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
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error(
          `pdf-converter request to /${path} timed out after ${RENDER_REQUEST_TIMEOUT_MS}ms`,
        )
      }
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`could not reach pdf-converter at ${converterUrl}: ${reason}`)
    }
    if (!response.ok) {
      throw await this.buildErrorFromResponse(response)
    }
    return (await response.json()) as { pageCount: number }
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

  private async buildErrorFromResponse(response: Response): Promise<Error> {
    let body: { message?: string | string[]; pageCount?: number } = {}
    try {
      body = (await response.json()) as typeof body
    } catch {
      // Non-json error body: fall through to the generic message.
    }
    // 422 is the converter's page-limit rejection; its body carries the
    // document's page count so the typed error can name it.
    if (response.status === 422 && typeof body.pageCount === "number") {
      return new PdfPageLimitExceededError(body.pageCount, MAX_PDF_PAGES_FOR_IMAGE_CONVERSION)
    }
    if (typeof body.message === "string") return new Error(body.message)
    if (Array.isArray(body.message)) return new Error(body.message.join(", "))
    return new Error(`pdf-converter responded with HTTP ${response.status}`)
  }
}
