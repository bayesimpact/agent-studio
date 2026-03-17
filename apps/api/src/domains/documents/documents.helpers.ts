import { UnprocessableEntityException } from "@nestjs/common"

export function extractFileExtension(fileName: string): string {
  const extension = fileName.split(".").pop() || ""
  if (extension.trim().length === 0) {
    throw new UnprocessableEntityException("File extension is required.")
  }
  return extension
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
