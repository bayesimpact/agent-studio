import type { INestApplication } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import request from "supertest"
import { AppModule } from "../app.module"
import { configureApp } from "../app-setup"

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])

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

describe("pdf-renderer", () => {
  let app: INestApplication

  beforeAll(async () => {
    delete process.env.PDF_RENDERER_AUTH_TOKEN
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication({ bodyParser: false })
    configureApp(app)
    await app.init()
  })

  afterEach(() => {
    delete process.env.PDF_RENDERER_AUTH_TOKEN
  })

  afterAll(async () => {
    await app.close()
  })

  const postPdf = (body: Buffer, query = "") =>
    request(app.getHttpServer())
      .post(`/render-pages${query}`)
      .set("Content-Type", "application/pdf")
      .send(body)

  describe("GET /healthz", () => {
    it("responds ok without authentication even when a token is configured", async () => {
      process.env.PDF_RENDERER_AUTH_TOKEN = "secret-token"

      const response = await request(app.getHttpServer()).get("/healthz")

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: "ok" })
    })
  })

  describe("POST /render-pages", () => {
    it("renders a single-page pdf into one base64 png page", async () => {
      const response = await postPdf(buildPdfWithPages(1))

      expect(response.status).toBe(201)
      // Chunked, not Content-Length: Cloud Run drops non-chunked HTTP/1
      // responses larger than 32MiB, which image-heavy pdfs exceed.
      expect(response.headers["transfer-encoding"]).toBe("chunked")
      expect(response.body.pages).toHaveLength(1)
      const pngBuffer = Buffer.from(response.body.pages[0], "base64")
      expect(pngBuffer.subarray(0, 4)).toEqual(PNG_MAGIC)
    })

    it("renders each page of a multi-page pdf", async () => {
      const response = await postPdf(buildPdfWithPages(3))

      expect(response.status).toBe(201)
      expect(response.body.pages).toHaveLength(3)
      for (const page of response.body.pages) {
        expect(Buffer.from(page, "base64").subarray(0, 4)).toEqual(PNG_MAGIC)
      }
    })

    it("rejects with 422 when the pdf has more pages than the requested limit", async () => {
      const response = await postPdf(buildPdfWithPages(3), "?maxPages=2")

      expect(response.status).toBe(422)
      expect(response.body.message).toBe(
        "PDF has 3 pages, but at most 2 pages can be converted to images",
      )
    })

    it("rejects with 422 when the pdf exceeds the default page limit", async () => {
      const response = await postPdf(buildPdfWithPages(21))

      expect(response.status).toBe(422)
      expect(response.body.message).toBe(
        "PDF has 21 pages, but at most 20 pages can be converted to images",
      )
    })

    it("clamps the rendered size of oversized pages to the pixel budget", async () => {
      const hugePageSize = 3000
      const maxPixelsPerPage = 4_000_000

      const response = await postPdf(
        buildPdfWithPages(1, hugePageSize),
        `?maxPixelsPerPage=${maxPixelsPerPage}`,
      )

      expect(response.status).toBe(201)
      const pngBuffer = Buffer.from(response.body.pages[0], "base64")
      const widthPx = pngBuffer.readUInt32BE(16)
      const heightPx = pngBuffer.readUInt32BE(20)
      expect(widthPx * heightPx).toBeLessThanOrEqual(maxPixelsPerPage)
      expect(widthPx).toBeGreaterThan(hugePageSize / 2)
    })

    it("rejects with 400 when the body is not valid pdf bytes", async () => {
      const response = await postPdf(Buffer.from("not a pdf at all"))

      expect(response.status).toBe(400)
    })

    it("rejects with 400 when the body is missing or not application/pdf", async () => {
      const response = await request(app.getHttpServer())
        .post("/render-pages")
        .set("Content-Type", "application/json")
        .send({ pdf: "nope" })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe("Request body must be non-empty application/pdf bytes")
    })

    it("rejects with 400 when a query parameter is not a valid number", async () => {
      const response = await postPdf(buildPdfWithPages(1), "?maxPages=abc")

      expect(response.status).toBe(400)
    })

    it("rejects with 400 when a query parameter exceeds the service ceiling", async () => {
      const response = await postPdf(buildPdfWithPages(1), "?maxPages=1000")

      expect(response.status).toBe(400)
    })
  })

  describe("authentication", () => {
    it("rejects with 401 when a token is configured and the header is missing", async () => {
      process.env.PDF_RENDERER_AUTH_TOKEN = "secret-token"

      const response = await postPdf(buildPdfWithPages(1))

      expect(response.status).toBe(401)
    })

    it("rejects with 401 when the bearer token does not match", async () => {
      process.env.PDF_RENDERER_AUTH_TOKEN = "secret-token"

      const response = await postPdf(buildPdfWithPages(1)).set(
        "Authorization",
        "Bearer wrong-token",
      )

      expect(response.status).toBe(401)
    })

    it("accepts the request when the bearer token matches", async () => {
      process.env.PDF_RENDERER_AUTH_TOKEN = "secret-token"

      const response = await postPdf(buildPdfWithPages(1)).set(
        "Authorization",
        "Bearer secret-token",
      )

      expect(response.status).toBe(201)
      expect(response.body.pages).toHaveLength(1)
    })
  })
})
