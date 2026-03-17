import { UnsupportedMediaTypeException } from "@nestjs/common"
import * as doclingCli from "@/external/docling/docling.cli"
import { DocumentTextExtractorService } from "./document-text-extractor.service"

jest.mock("@/external/docling/docling.cli", () => ({
  extractTextWithDocling: jest.fn(),
  isDoclingEnabled: jest.fn(),
}))

describe("DocumentTextExtractorService", () => {
  const mockExtractTextWithDocling = jest.mocked(doclingCli.extractTextWithDocling)
  const mockIsDoclingEnabled = jest.mocked(doclingCli.isDoclingEnabled)
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetAllMocks()
    process.env = { ...originalEnv }
    mockIsDoclingEnabled.mockReturnValue(true)
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("extracts plain text documents without docling", async () => {
    const extractor = new DocumentTextExtractorService()

    const result = await extractor.extract(Buffer.from("hello world"), "text/plain")

    expect(result).toBe("hello world")
    expect(mockExtractTextWithDocling).not.toHaveBeenCalled()
  })

  it("uses docling for supported non-text mime types", async () => {
    const extractor = new DocumentTextExtractorService()
    mockExtractTextWithDocling.mockResolvedValue("# Converted markdown\n")

    const result = await extractor.extract(Buffer.from("fake"), "image/png")

    expect(result).toBe("# Converted markdown\n")
    expect(mockExtractTextWithDocling).toHaveBeenCalledTimes(1)
  })

  it("throws on unsupported mime types when docling is disabled", async () => {
    mockIsDoclingEnabled.mockReturnValue(false)
    const extractor = new DocumentTextExtractorService()

    await expect(extractor.extract(Buffer.from("fake"), "image/png")).rejects.toBeInstanceOf(
      UnsupportedMediaTypeException,
    )
  })
})
