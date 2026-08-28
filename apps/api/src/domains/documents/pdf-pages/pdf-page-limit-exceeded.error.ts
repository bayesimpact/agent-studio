// Thrown before rendering when a pdf has more pages than image-only models
// accept. The message is user-facing: it is shown verbatim in the chat error
// bubble and in extraction run error details.
export class PdfPageLimitExceededError extends Error {
  constructor(
    readonly pageCount: number,
    readonly maxPages: number,
  ) {
    super(`This PDF has ${pageCount} pages; the maximum is ${maxPages} pages.`)
    this.name = "PdfPageLimitExceededError"
  }
}
