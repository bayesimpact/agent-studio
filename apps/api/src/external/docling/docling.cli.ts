import { execFile } from "node:child_process"
import { randomUUID } from "node:crypto"
import { readFile, unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import { EXTENSION_BY_MIME_TYPE } from "./docling.constants"

const DEFAULT_DOCLING_COMMAND = "docling"
const DEFAULT_DOCLING_TIMEOUT_MS = 60_000

const runCommand = promisify(execFile)

export function isDoclingEnabled(): boolean {
  const value = process.env.DOCUMENT_EXTRACTOR_DOCLING_ENABLED
  if (!value) {
    return true
  }
  return value.toLowerCase() === "true"
}

export function getDoclingCommand(): string {
  return process.env.DOCUMENT_EXTRACTOR_DOCLING_COMMAND || DEFAULT_DOCLING_COMMAND
}

export function getDoclingTimeoutMs(defaultTimeoutMs = DEFAULT_DOCLING_TIMEOUT_MS): number {
  const value = process.env.DOCUMENT_EXTRACTOR_DOCLING_TIMEOUT_MS
  if (!value) {
    return defaultTimeoutMs
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultTimeoutMs : parsed
}

export async function extractTextWithDocling({
  buffer,
  mimeType,
  timeoutMs,
  maxBuffer,
}: {
  buffer: Buffer
  mimeType: string
  timeoutMs?: number
  maxBuffer: number
}): Promise<string> {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType]
  if (!extension) {
    throw new Error(`Docling does not support MIME type mapping: ${mimeType}`)
  }

  const inputPath = join(tmpdir(), `docling-${randomUUID()}.${extension}`)
  const outputPath = join(tmpdir(), `docling-${randomUUID()}.md`)
  await writeFile(inputPath, buffer)

  try {
    await runCommand(getDoclingCommand(), [inputPath, "--output", outputPath], {
      timeout: timeoutMs ?? getDoclingTimeoutMs(),
      maxBuffer,
    })
    return await readFile(outputPath, "utf-8")
  } finally {
    await unlink(inputPath).catch(() => undefined)
    await unlink(outputPath).catch(() => undefined)
  }
}

export async function getDoclingVersion({
  timeoutMs,
  maxBuffer = 1024 * 1024,
}: {
  timeoutMs?: number
  maxBuffer?: number
} = {}): Promise<string> {
  const { stdout } = await runCommand(getDoclingCommand(), ["--version"], {
    timeout: timeoutMs ?? getDoclingTimeoutMs(),
    maxBuffer,
  })
  return stdout.trim()
}
