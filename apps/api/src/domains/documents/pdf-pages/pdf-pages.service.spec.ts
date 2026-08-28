import type { IFileStorage } from "../storage/file-storage.interface"
import { PdfConverterClient } from "./pdf-converter.client"
import { PdfPagesService } from "./pdf-pages.service"

describe("PdfPagesService", () => {
  const buildService = () => new PdfPagesService(new PdfConverterClient())

  const buildFileStorageService = () =>
    ({
      getTemporaryUrl: jest.fn((storageRelativePath: string) =>
        Promise.resolve(`https://storage.example.test/${storageRelativePath}?signature=abc`),
      ),
    }) as unknown as IFileStorage

  afterEach(() => {
    jest.restoreAllMocks()
    delete process.env.PDF_CONVERTER_URL
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

  it("returns one signed url per page without calling the converter when the count is cached", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch")
    const onPageCountUpdate = jest.fn()

    const imageUrls = await buildService().getImageUrls({
      document: { storageRelativePath: "org1/proj1/doc1.pdf", pdfPageCount: 2 },
      onPageCountUpdate,
      fileStorageService: buildFileStorageService(),
    })

    expect(imageUrls).toEqual([
      "https://storage.example.test/org1/proj1/derived/doc1/page-1.png?signature=abc",
      "https://storage.example.test/org1/proj1/derived/doc1/page-2.png?signature=abc",
    ])
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(onPageCountUpdate).not.toHaveBeenCalled()
  })

  it("renders the document and reports the page count when it is not cached", async () => {
    process.env.PDF_CONVERTER_URL = "http://pdf-converter.test"
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ pageCount: 2 }), { status: 200 }))
    const onPageCountUpdate = jest.fn()

    const imageUrls = await buildService().getImageUrls({
      document: { storageRelativePath: "org1/proj1/doc1.pdf", pdfPageCount: null },
      onPageCountUpdate,
      fileStorageService: buildFileStorageService(),
    })

    expect(imageUrls).toEqual([
      "https://storage.example.test/org1/proj1/derived/doc1/page-1.png?signature=abc",
      "https://storage.example.test/org1/proj1/derived/doc1/page-2.png?signature=abc",
    ])
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0]!
    expect(String(calledUrl)).toBe("http://pdf-converter.test/render-document")
    expect(JSON.parse(String(calledInit?.body))).toEqual({
      sourceObject: "org1/proj1/doc1.pdf",
      outputPrefix: "org1/proj1/derived/doc1/",
      maxPages: 20,
      maxPixelsPerPage: 4_000_000,
    })
    expect(onPageCountUpdate).toHaveBeenCalledWith(2)
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
    const onPageCountUpdate = jest.fn()

    await expect(
      buildService().getImageUrls({
        document: { storageRelativePath: "org1/proj1/doc1.pdf", pdfPageCount: null },
        onPageCountUpdate,
        fileStorageService: buildFileStorageService(),
      }),
    ).rejects.toThrow("page limit exceeded")
    expect(onPageCountUpdate).not.toHaveBeenCalled()
  })
})
