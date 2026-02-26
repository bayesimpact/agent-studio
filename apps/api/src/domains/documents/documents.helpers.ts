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
