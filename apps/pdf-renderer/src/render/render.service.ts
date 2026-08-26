import { type ExecFileException, execFile } from "node:child_process"
import { join } from "node:path"
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from "@nestjs/common"

export type RenderOptions = {
  maxPages: number
  maxPixelsPerPage: number
  scale: number
}

const RENDER_TIMEOUT_MS = 60_000
const RENDER_MAX_OUTPUT_BYTES = 256 * 1024 * 1024

// The render script exits with this code when the pdf exceeds the page
// limit: a caller error (422), not a rendering failure.
const PAGE_LIMIT_EXIT_CODE = 2

// Rendering runs in a short-lived subprocess (a plain ESM script, ships to
// dist via the nest-cli assets rule): a malicious or degenerate pdf that
// crashes or hangs the renderer only takes down that child process, which
// gets a hard timeout and heap cap and inherits none of the parent's env.
const RENDER_SCRIPT_PATH = join(__dirname, "pdf-pages-to-png.script.mjs")

@Injectable()
export class RenderService {
  renderPdfPagesToPng(pdfBytes: Buffer, options: RenderOptions): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const child = execFile(
        process.execPath,
        [
          "--max-old-space-size=1024",
          RENDER_SCRIPT_PATH,
          String(options.maxPages),
          String(options.maxPixelsPerPage),
          String(options.scale),
        ],
        { timeout: RENDER_TIMEOUT_MS, maxBuffer: RENDER_MAX_OUTPUT_BYTES, env: {} },
        (error, stdout, stderr) => {
          if (error) {
            reject(toHttpException(error, stderr))
            return
          }
          resolve((JSON.parse(stdout) as { pages: string[] }).pages)
        },
      )
      child.stdin?.on("error", () => {
        // EPIPE when the child dies before draining stdin (e.g. it fails at
        // startup); the failure is reported through the execFile callback's
        // non-zero-exit error instead of crashing this process.
      })
      child.stdin?.end(pdfBytes)
    })
  }
}

function toHttpException(error: ExecFileException, stderr: string): Error {
  if (error.killed) {
    return new InternalServerErrorException(`PDF rendering timed out after ${RENDER_TIMEOUT_MS}ms`)
  }
  const message = stderr.trim()
  if (error.code === PAGE_LIMIT_EXIT_CODE) {
    return new UnprocessableEntityException(message)
  }
  return new BadRequestException(message || `PDF rendering failed: ${error.message}`)
}
