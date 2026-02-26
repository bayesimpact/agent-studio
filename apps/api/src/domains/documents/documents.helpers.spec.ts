import { normalizeUploadedFileName } from "./documents.helpers"

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
