import { Injectable } from "@nestjs/common"
import { GoogleAuth } from "google-auth-library"

// Guards against oversized vision requests: each page becomes one image sent
// to the model, so unbounded PDFs would blow up the request payload.
export const MAX_PDF_PAGES_FOR_IMAGE_CONVERSION = 20

// A malicious or degenerate pdf can declare an arbitrarily large page size;
// rasterizing it at full scale would allocate width*height*4 bytes per page.
export const MAX_RENDERED_PIXELS_PER_PAGE = 4_000_000

// Rendering happens once per document (cached in pdf_page_count) so a generous
// timeout is fine; the converter's own render timeout is stricter.
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
  // Returns the number of pages rendered.
  async generatePdfPageImages({
    sourceObject,
    outputPrefix,
  }: {
    sourceObject: string
    outputPrefix: string
  }): Promise<number> {
    const converterUrl = this.resolveConverterUrl()
    const endpoint = new URL(
      "render-document",
      converterUrl.endsWith("/") ? converterUrl : `${converterUrl}/`,
    )
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await this.buildAuthHeaders(converterUrl)),
        },
        body: JSON.stringify({
          sourceObject,
          outputPrefix,
          maxPages: MAX_PDF_PAGES_FOR_IMAGE_CONVERSION,
          maxPixelsPerPage: MAX_RENDERED_PIXELS_PER_PAGE,
        }),
        signal: AbortSignal.timeout(RENDER_REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error(`PDF rendering timed out after ${RENDER_REQUEST_TIMEOUT_MS}ms`)
      }
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(
        `PDF rendering failed: could not reach pdf-converter at ${converterUrl}: ${reason}`,
      )
    }
    if (!response.ok) {
      throw new Error(await this.extractErrorMessage(response))
    }
    return ((await response.json()) as { pageCount: number }).pageCount
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
    const fallback = `PDF rendering failed: pdf-converter responded with HTTP ${response.status}`
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
