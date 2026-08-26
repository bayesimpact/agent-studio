import { BadRequestException, Controller, Get, Post, Query, Req, Res } from "@nestjs/common"
import type { Request, Response } from "express"
// biome-ignore lint/style/useImportType: Required at runtime for NestJS DI
import { RenderService } from "./render.service"

// Defaults mirror what the main API sends; they also protect the service
// when a caller omits the query parameters.
const DEFAULT_MAX_PAGES = 20
const DEFAULT_MAX_PIXELS_PER_PAGE = 4_000_000
const DEFAULT_RENDER_SCALE = 2

// Hard ceilings: rendering allocates width*height*4 bytes per page, so no
// caller may request an unbounded workload.
const MAX_PAGES_CEILING = 100
const MAX_PIXELS_PER_PAGE_CEILING = 16_000_000
const RENDER_SCALE_CEILING = 4

function parseBoundedNumber(
  name: string,
  raw: string | undefined,
  fallback: number,
  ceiling: number,
): number {
  if (raw === undefined) {
    return fallback
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0 || value > ceiling) {
    throw new BadRequestException(
      `Query parameter ${name} must be a number between 0 and ${ceiling}`,
    )
  }
  return value
}

@Controller()
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Get("healthz")
  healthz(): { status: string } {
    return { status: "ok" }
  }

  @Post("render-pages")
  async renderPages(
    @Req() request: Request,
    @Res() response: Response,
    @Query("maxPages") maxPages?: string,
    @Query("maxPixelsPerPage") maxPixelsPerPage?: string,
    @Query("scale") scale?: string,
  ): Promise<void> {
    const pdfBytes = request.body
    if (!Buffer.isBuffer(pdfBytes) || pdfBytes.length === 0) {
      throw new BadRequestException("Request body must be non-empty application/pdf bytes")
    }
    const pages = await this.renderService.renderPdfPagesToPng(pdfBytes, {
      maxPages: parseBoundedNumber("maxPages", maxPages, DEFAULT_MAX_PAGES, MAX_PAGES_CEILING),
      maxPixelsPerPage: parseBoundedNumber(
        "maxPixelsPerPage",
        maxPixelsPerPage,
        DEFAULT_MAX_PIXELS_PER_PAGE,
        MAX_PIXELS_PER_PAGE_CEILING,
      ),
      scale: parseBoundedNumber("scale", scale, DEFAULT_RENDER_SCALE, RENDER_SCALE_CEILING),
    })
    // Stream the payload chunked (no Content-Length): a rendered page can be
    // several MB of base64 and Cloud Run drops non-chunked HTTP/1 responses
    // larger than 32MiB.
    response.status(201)
    response.setHeader("Content-Type", "application/json")
    response.write('{"pages":[')
    for (const [pageIndex, page] of pages.entries()) {
      response.write((pageIndex > 0 ? "," : "") + JSON.stringify(page))
    }
    response.end("]}")
  }
}
