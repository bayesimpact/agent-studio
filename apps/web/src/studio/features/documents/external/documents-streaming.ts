import {
  type DocumentEmbeddingStatusChangedEventDto,
  DocumentsRoutes,
} from "@caseai-connect/api-contracts"
import { getAccessToken } from "@/external/auth0Client"
import type { DocumentEmbeddingStatusChangedEvent } from "../documents.models"

function parseSSEEvent(eventText: string): DocumentEmbeddingStatusChangedEventDto | null {
  const dataLine = eventText.split("\n").find((line) => line.startsWith("data: "))
  if (!dataLine) return null

  try {
    return JSON.parse(dataLine.slice(6)) as DocumentEmbeddingStatusChangedEventDto
  } catch (parseError) {
    console.error(
      "Failed to parse document embedding status SSE event:",
      parseError,
      "Data:",
      dataLine.slice(6),
    )
    return null
  }
}

function fromDto(
  eventDto: DocumentEmbeddingStatusChangedEventDto,
): DocumentEmbeddingStatusChangedEvent {
  return {
    documentId: eventDto.documentId,
    embeddingStatus: eventDto.embeddingStatus,
    updatedAt: eventDto.updatedAt,
  }
}

/** Returns true when stream can be terminated. */
function processSSEChunk(
  chunk: string,
  onEvent: (event: DocumentEmbeddingStatusChangedEvent) => void,
): { remaining: string; done: boolean } {
  const parts = chunk.split("\n\n")
  const remaining = parts.pop() ?? ""

  for (const eventText of parts) {
    if (!eventText.trim()) continue
    const event = parseSSEEvent(eventText)
    if (!event) continue
    if (event.type !== "document_embedding_status_changed") continue
    onEvent(fromDto(event))
  }

  return { remaining, done: false }
}

export async function streamDocumentEmbeddingStatus(params: {
  organizationId: string
  projectId: string
  signal?: AbortSignal
  onStatusChanged: (event: DocumentEmbeddingStatusChangedEvent) => void
}): Promise<void> {
  const token = await getAccessToken()
  const baseURL = import.meta.env.VITE_API_URL as string
  const streamPath = DocumentsRoutes.streamEmbeddingStatus.getPath({
    organizationId: params.organizationId,
    projectId: params.projectId,
  })

  const response = await fetch(`${baseURL}${streamPath}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
    signal: params.signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Documents SSE failed: ${response.status} ${errorText}`)
  }

  if (!response.body) {
    throw new Error("Documents SSE response body is null")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        if (buffer.trim()) processSSEChunk(`${buffer}\n\n`, (event) => onEvent(event))
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const result = processSSEChunk(buffer, (event) => onEvent(event))
      buffer = result.remaining
      if (result.done) return
    }
  } finally {
    reader.releaseLock()
  }

  function onEvent(event: DocumentEmbeddingStatusChangedEvent): void {
    params.onStatusChanged(event)
  }
}
