import { AgentSessionMessagesRoutes, type StreamEvent } from "@caseai-connect/api-contracts"
import { getAccessToken } from "@/external/auth0Client"

export type StreamEventHandler = {
  onStart?: (event: Extract<StreamEvent, { type: "start" }>) => void
  onChunk: (event: Extract<StreamEvent, { type: "chunk" }>) => void
  onNotifyClient: (event: Extract<StreamEvent, { type: "notify_client" }>) => void
  onEnd: (event: Extract<StreamEvent, { type: "end" }>) => void
  onError: (event: Extract<StreamEvent, { type: "error" }>) => void
}

function parseSSEEvent(eventText: string): StreamEvent | null {
  const dataLine = eventText.split("\n").find((line) => line.startsWith("data: "))
  if (!dataLine) return null
  try {
    return JSON.parse(dataLine.slice(6)) as StreamEvent
  } catch (parseError) {
    console.error("Failed to parse SSE event:", parseError, "Data:", dataLine.slice(6))
    return null
  }
}

/** Returns true if the stream should terminate. */
function dispatchStreamEvent(event: StreamEvent, handlers: StreamEventHandler): boolean {
  if (event.type === "start") handlers.onStart?.(event)
  else if (event.type === "chunk") handlers.onChunk(event)
  else if (event.type === "notify_client") handlers.onNotifyClient(event)
  else if (event.type === "end") {
    handlers.onEnd(event)
    return true
  } else if (event.type === "error") {
    handlers.onError(event)
    return true
  }
  return false
}

function processSSEChunk(
  chunk: string,
  handlers: StreamEventHandler,
): { remaining: string; done: boolean } {
  const parts = chunk.split("\n\n")
  const remaining = parts.pop() ?? ""

  for (const eventText of parts) {
    if (!eventText.trim()) continue
    const event = parseSSEEvent(eventText)
    if (event && dispatchStreamEvent(event, handlers)) return { remaining, done: true }
  }

  return { remaining, done: false }
}

/**
 * Streams a chat response using Server-Sent Events (SSE).
 * Uses fetch instead of EventSource to support Authorization headers.
 */
export async function streamChatResponse({
  organizationId,
  projectId,
  agentId,
  agentSessionId,
  content,
  documentId,
  handlers,
  signal,
}: {
  organizationId: string
  projectId: string
  agentId: string
  agentSessionId: string
  content: string
  documentId?: string
  handlers: StreamEventHandler
  signal?: AbortSignal
}): Promise<void> {
  try {
    const token = await getAccessToken()
    const baseURL = import.meta.env.VITE_API_URL as string
    const body = {
      payload: { content, documentId },
    } satisfies typeof AgentSessionMessagesRoutes.stream.request
    const url = `${baseURL}${AgentSessionMessagesRoutes.stream.getPath({ organizationId, projectId, agentId, agentSessionId })}?q=${encodeURIComponent(JSON.stringify(body))}`

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(`Streaming failed: ${response.status} ${errorText}`)
    }
    if (!response.body) throw new Error("Response body is null")

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Flush any remaining buffered events
          if (buffer.trim()) processSSEChunk(`${buffer}\n\n`, handlers)
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const result = processSSEChunk(buffer, handlers)
        buffer = result.remaining
        if (result.done) return
      }
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    throw new Error("Fail to stream", { cause: error })
  }
}
