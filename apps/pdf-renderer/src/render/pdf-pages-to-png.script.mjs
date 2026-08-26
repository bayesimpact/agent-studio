// Renders every page of a PDF (received on stdin) to PNG and writes
// {"pages": ["<base64 png>", ...]} to stdout.
//
// Runs as a short-lived subprocess (see render.service.ts) so that a
// malicious or degenerate PDF can only crash/hang this process — never the
// serving event loop — and so that the ESM-only pdfjs-dist loads under
// plain Node, outside jest's CommonJS module registry.
//
// Usage: node pdf-pages-to-png.script.mjs <maxPages> <maxPixelsPerPage> <renderScale>
//
// Exit codes: 0 success, 2 page limit exceeded, 1 any other failure.
import { createCanvas } from "@napi-rs/canvas"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

const [maxPages, maxPixelsPerPage, renderScale] = process.argv.slice(2).map(Number)

const stdinChunks = []
for await (const chunk of process.stdin) {
  stdinChunks.push(chunk)
}
const pdfBytes = new Uint8Array(Buffer.concat(stdinChunks))

try {
  const loadingTask = getDocument({ data: pdfBytes })
  const pdfDocument = await loadingTask.promise
  if (pdfDocument.numPages > maxPages) {
    process.stderr.write(
      `PDF has ${pdfDocument.numPages} pages, but at most ${maxPages} pages can be converted to images`,
    )
    process.exit(2)
  }
  const pages = []
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber)
    const baseViewport = page.getViewport({ scale: 1 })
    // A pdf can declare an arbitrarily large page size; rendering allocates
    // width*height*4 bytes, so clamp the bitmap to the pixel budget instead
    // of trusting the document.
    const scale = Math.min(
      renderScale,
      Math.sqrt(maxPixelsPerPage / (baseViewport.width * baseViewport.height)),
    )
    const viewport = page.getViewport({ scale })
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
    await page.render({ canvas, viewport }).promise
    const pngBuffer = await canvas.encode("png")
    pages.push(pngBuffer.toString("base64"))
    page.cleanup()
  }
  await loadingTask.destroy()
  process.stdout.write(JSON.stringify({ pages }))
} catch (error) {
  process.stderr.write(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
