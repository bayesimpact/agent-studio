// Thrown before rendering when a pdf reports zero pages (empty or corrupt
// document): a zero count must fail loudly, otherwise the model would be
// called with no page images and hallucinate from the bare prompt. The
// message is user-facing: it is shown verbatim in the chat error bubble and
// in extraction run error details.
export class PdfHasNoPagesError extends Error {
  constructor() {
    super("This PDF has no pages that can be rendered.")
    this.name = "PdfHasNoPagesError"
  }
}
