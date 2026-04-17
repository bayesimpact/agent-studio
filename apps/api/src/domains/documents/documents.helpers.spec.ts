import { normalizeUploadedFileName, parseMultipartTagIdsField } from "./documents.helpers"

describe("parseMultipartTagIdsField", () => {
  it("returns undefined for empty input", () => {
    expect(parseMultipartTagIdsField(undefined)).toBeUndefined()
    expect(parseMultipartTagIdsField(null)).toBeUndefined()
    expect(parseMultipartTagIdsField("")).toBeUndefined()
    expect(parseMultipartTagIdsField("   ")).toBeUndefined()
    expect(parseMultipartTagIdsField([])).toBeUndefined()
  })

  it("normalizes a single string to a one-element array", () => {
    expect(parseMultipartTagIdsField("abc-123")).toEqual(["abc-123"])
  })

  it("filters empty strings from an array", () => {
    expect(parseMultipartTagIdsField(["a", "", "  ", "b"])).toEqual(["a", "b"])
  })
})

describe("normalizeUploadedFileName", () => {
  it("keeps regular ASCII names unchanged", () => {
    expect(normalizeUploadedFileName("test-document.pdf")).toBe("test-document.pdf")
  })

  it("decodes latin1 mojibake to utf8", () => {
    const expectedName =
      "Immobilier : est-ce le moment de se lancer dans l’investissement locatif ?.pdf"
    const mojibakeName = Buffer.from(expectedName, "utf8").toString("latin1")

    expect(normalizeUploadedFileName(mojibakeName)).toBe(expectedName)
  })
})
