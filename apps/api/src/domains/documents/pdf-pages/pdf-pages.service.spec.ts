import { PdfConverterClient } from "./pdf-converter.client"
import { PdfPagesService } from "./pdf-pages.service"

describe("PdfPagesService", () => {
  const buildService = () => new PdfPagesService(new PdfConverterClient())

  afterEach(() => {
    jest.restoreAllMocks()
    delete process.env.PDF_CONVERTER_URL
    delete process.env.API_PUBLIC_BASE_URL
  })

  it("derives the pages prefix from the source path", () => {
    expect(buildService().derivedPagesPrefix("org1/proj1/doc1.pdf")).toBe(
      "org1/proj1/derived/doc1/",
    )
  })

  it("builds the page object path", () => {
    expect(buildService().pageObjectPath("org1/proj1/doc1.pdf", 3)).toBe(
      "org1/proj1/derived/doc1/page-3.png",
    )
  })

  it("returns the cached page count without calling the converter", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch")
    const pageCount = await buildService().ensureRenderedPages({
      storageRelativePath: "org1/proj1/doc1.pdf",
      cachedPageCount: 4,
    })
    expect(pageCount).toBe(4)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("calls the converter with source, prefix and limits when not cached", async () => {
    process.env.PDF_CONVERTER_URL = "http://pdf-converter.test"
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ pageCount: 2 }), { status: 200 }))
    const pageCount = await buildService().ensureRenderedPages({
      storageRelativePath: "org1/proj1/doc1.pdf",
      cachedPageCount: null,
    })
    expect(pageCount).toBe(2)
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0]!
    expect(String(calledUrl)).toBe("http://pdf-converter.test/render-document")
    expect(JSON.parse(String(calledInit?.body))).toEqual({
      sourceObject: "org1/proj1/doc1.pdf",
      outputPrefix: "org1/proj1/derived/doc1/",
      maxPages: 20,
      maxPixelsPerPage: 4_000_000,
    })
  })

  it("surfaces the converter's error message", async () => {
    process.env.PDF_CONVERTER_URL = "http://pdf-converter.test"
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ message: "page limit exceeded: pdf has 30 pages, max is 20" }),
        {
          status: 422,
        },
      ),
    )
    await expect(
      buildService().ensureRenderedPages({
        storageRelativePath: "org1/proj1/doc1.pdf",
        cachedPageCount: null,
      }),
    ).rejects.toThrow("page limit exceeded")
  })

  it("builds stable attachment page urls from API_PUBLIC_BASE_URL", () => {
    process.env.API_PUBLIC_BASE_URL = "https://api.example.test"
    const url = buildService().buildAttachmentPageImageUrl({
      organizationId: "org1",
      projectId: "proj1",
      attachmentDocumentId: "att1",
      pageNumber: 2,
    })
    expect(url.toString()).toBe(
      "https://api.example.test/organizations/org1/projects/proj1/agent-attachment-documents/att1/pdf-pages/2",
    )
  })

  it("throws a clear error when API_PUBLIC_BASE_URL is unset", () => {
    expect(() =>
      buildService().buildAttachmentPageImageUrl({
        organizationId: "org1",
        projectId: "proj1",
        attachmentDocumentId: "att1",
        pageNumber: 1,
      }),
    ).toThrow("API_PUBLIC_BASE_URL")
  })
})
