import { execFile } from "node:child_process"
import { randomUUID } from "node:crypto"
import { existsSync } from "node:fs"
import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import { EXTENSION_BY_MIME_TYPE } from "./docling.constants"

const DOCLING_NODES_COMMAND_RELATIVE_FROM_API = "bin/docling_nodes"
const DOCLING_NODES_COMMAND_RELATIVE_FROM_REPO_ROOT = "apps/api/bin/docling_nodes"
const DEFAULT_DOCLING_TIMEOUT_MS = 60_000

const runCommand = promisify(execFile)

export type DoclingChunk = {
  chunk_id: string
  embed_text: string
  text: string
  parent_id: string | null
  prev_chunk_id: string | null
  next_chunk_id: string | null
  headings: string[]
  captions: string[]
  metadata: Record<string, unknown>
}

export type DoclingParentChunk = {
  chunk_id: string
  embed_text: string
  text: string
  prev_chunk_id: string | null
  next_chunk_id: string | null
  headings: string[]
  captions: string[]
}

export type DoclingOutput = {
  child_chunks: DoclingChunk[]
  parent_chunks: DoclingParentChunk[]
}

export function isDoclingEnabled(): boolean {
  const value = process.env.DOCUMENT_EXTRACTOR_DOCLING_ENABLED
  if (!value) {
    return true
  }
  return value.toLowerCase() === "true"
}

export function getDoclingNodesCommand(): string {
  const envOverride = process.env.DOCUMENT_EXTRACTOR_DOCLING_NODES_COMMAND
  if (envOverride) {
    return envOverride
  }

  // The API can run with cwd at repo root OR at apps/api.
  // Support both without requiring env configuration.
  const cwd = process.cwd()
  const candidates: [string, string] = [
    join(cwd, DOCLING_NODES_COMMAND_RELATIVE_FROM_API),
    join(cwd, DOCLING_NODES_COMMAND_RELATIVE_FROM_REPO_ROOT),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  // Fall back to the repo-root shape for a clearer error message.
  return candidates[1]
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
}): Promise<DoclingOutput> {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType]
  if (!extension) {
    throw new Error(`Docling does not support MIME type mapping: ${mimeType}`)
  }

  const inputPath = join(tmpdir(), `docling-${randomUUID()}.${extension}`)
  await writeFile(inputPath, buffer)

  try {
    const { stdout } = await runCommand(
      getDoclingNodesCommand(),
      ["--doc-path", inputPath, "--output-stdout"],
      {
        timeout: timeoutMs ?? getDoclingTimeoutMs(),
        maxBuffer,
      },
    )

    const stdoutTrimmed = stdout.trim()
    if (!stdoutTrimmed) {
      throw new Error(`Docling nodes produced empty stdout for MIME type: ${mimeType}`)
    }

    const parsed: unknown = JSON.parse(stdoutTrimmed)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(
        `Docling nodes returned unexpected JSON shape for MIME type ${mimeType}: ${stdoutTrimmed.slice(0, 200)}`,
      )
    }

    const record = parsed as Record<string, unknown>
    if (!Array.isArray(record.child_chunks) || !Array.isArray(record.parent_chunks)) {
      throw new Error(
        `Docling nodes output missing child_chunks or parent_chunks for MIME type ${mimeType}`,
      )
    }

    return parsed as DoclingOutput
  } finally {
    await unlink(inputPath).catch(() => undefined)
  }
}

export async function getDoclingVersion({
  timeoutMs,
  maxBuffer = 1024 * 1024,
}: {
  timeoutMs?: number
  maxBuffer?: number
} = {}): Promise<string> {
  const { stdout } = await runCommand(getDoclingNodesCommand(), ["--docling-version"], {
    timeout: timeoutMs ?? getDoclingTimeoutMs(),
    maxBuffer,
  })
  return stdout.trim()
}
