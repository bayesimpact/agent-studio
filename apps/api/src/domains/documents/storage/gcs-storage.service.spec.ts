import type { ConfigService } from "@nestjs/config"
import { GcsStorageService } from "./gcs-storage.service"

const getSignedUrl = jest.fn()

jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn().mockReturnValue({
      file: jest
        .fn()
        .mockReturnValue({ getSignedUrl: (...args: unknown[]) => getSignedUrl(...args) }),
    }),
  })),
}))

describe("GcsStorageService - getTemporaryUrl signed URL cache", () => {
  let service: GcsStorageService

  const configService = {
    get: (key: string) => (key === "GCS_STORAGE_BUCKET_NAME" ? "test-bucket" : undefined),
  } as unknown as ConfigService

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-08-31T10:00:00Z") })
    getSignedUrl.mockReset()
    let signatureCount = 0
    getSignedUrl.mockImplementation(async () => {
      signatureCount += 1
      return [`https://storage.example.com/signed-${signatureCount}`]
    })
    service = new GcsStorageService(configService)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("should sign once and serve repeat requests for the same path from the cache", async () => {
    const firstUrl = await service.getTemporaryUrl("org/proj/doc.pdf")
    const secondUrl = await service.getTemporaryUrl("org/proj/doc.pdf")

    expect(firstUrl).toBe("https://storage.example.com/signed-1")
    expect(secondUrl).toBe(firstUrl)
    expect(getSignedUrl).toHaveBeenCalledTimes(1)
  })

  it("should sign each distinct path separately", async () => {
    const pageOneUrl = await service.getTemporaryUrl("org/proj/derived/doc/page-1.png")
    const pageTwoUrl = await service.getTemporaryUrl("org/proj/derived/doc/page-2.png")

    expect(pageOneUrl).not.toBe(pageTwoUrl)
    expect(getSignedUrl).toHaveBeenCalledTimes(2)
  })

  it("should re-sign after the cache entry expires", async () => {
    const firstUrl = await service.getTemporaryUrl("org/proj/doc.pdf")

    jest.advanceTimersByTime(10 * 60 * 1000 + 1)
    const refreshedUrl = await service.getTemporaryUrl("org/proj/doc.pdf")

    expect(refreshedUrl).not.toBe(firstUrl)
    expect(getSignedUrl).toHaveBeenCalledTimes(2)
  })

  it("should keep serving the cached url just before the cache expiry", async () => {
    const firstUrl = await service.getTemporaryUrl("org/proj/doc.pdf")

    jest.advanceTimersByTime(10 * 60 * 1000 - 1)
    const cachedUrl = await service.getTemporaryUrl("org/proj/doc.pdf")

    expect(cachedUrl).toBe(firstUrl)
    expect(getSignedUrl).toHaveBeenCalledTimes(1)
  })
})
