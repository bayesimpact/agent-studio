import { UnprocessableEntityException } from "@nestjs/common"

export function extractFileExtension(fileName: string): string {
  const extension = fileName.split(".").pop() || ""
  if (extension.trim().length === 0) {
    throw new UnprocessableEntityException("File extension is required.")
  }
  return extension
}

/** Multer may expose repeated `tagIds` form fields as a string or string[]. */
export function parseMultipartTagIdsField(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? [trimmed] : undefined
  }
  if (!Array.isArray(value)) {
    return undefined
  }
  const tagIds = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  )
  return tagIds.length > 0 ? tagIds : undefined
}

export function normalizeUploadedFileName(originalFileName: string): string {
  const likelyMojibake = /(?:Ã.|Â|â[\u0080-\u00BF])/.test(originalFileName)
  if (!likelyMojibake) {
    return originalFileName
  }

  const decodedFileName = Buffer.from(originalFileName, "latin1").toString("utf8")
  const originalScore = (originalFileName.match(/[ÂÃâ�]/g) ?? []).length
  const decodedScore = (decodedFileName.match(/[ÂÃâ�]/g) ?? []).length

  return decodedScore < originalScore ? decodedFileName : originalFileName
}
