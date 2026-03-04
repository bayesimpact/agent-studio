import { AgentSessionMessagesRoutes } from "@caseai-connect/api-contracts"
import { getAccessToken } from "@/external/auth0Client"

export type StreamEvent =
  | { type: "start"; messageId: string }
  | { type: "chunk"; content: string; messageId: string }
  | { type: "end"; messageId: string; fullContent: string }
  | { type: "error"; messageId: string; error: string }

export type StreamEventHandler = {
  onStart?: (event: { type: "start"; messageId: string }) => void
  onChunk: (event: { type: "chunk"; content: string; messageId: string }) => void
  onEnd: (event: { type: "end"; messageId: string; fullContent: string }) => void
  onError: (event: { type: "error"; messageId: string; error: string }) => void
}

/**
 * Streams a chat response using Server-Sent Events (SSE) via axios.
 * Uses axios instead of EventSource to support Authorization headers.
 */
export async function streamChatResponse({
  organizationId,
  projectId,
  agentId,
  sessionId,
  content,
  documentId,
  handlers,
  signal,
}: {
  organizationId: string
  projectId: string
  agentId: string
  sessionId: string
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
    const url = `${baseURL}${AgentSessionMessagesRoutes.stream.getPath({ organizationId, projectId, agentId, sessionId })}?q=${encodeURIComponent(JSON.stringify(body))}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(`Streaming failed: ${response.status} ${errorText}`)
    }

    if (!response.body) {
      throw new Error("Response body is null")
    }

    // FIXME: use axios
    // const response = await axios.post<typeof ConversationAgentSessionStreamingRoutes.stream.response>(
    //   ConversationAgentSessionStreamingRoutes.stream.getPath({ organizationId, projectId, agentId, sessionId }),
    //   {
    //     payload: { content, documentId },
    //   } satisfies typeof ConversationAgentSessionStreamingRoutes.stream.request,
    //   { signal },
    // )

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            const events = buffer.split("\n\n").filter((event) => event.trim())
            for (const eventText of events) {
              const dataLine = eventText.split("\n").find((line) => line.startsWith("data: "))
              if (dataLine) {
                const data = dataLine.slice(6) // Remove "data: " prefix
                try {
                  const event: StreamEvent = JSON.parse(data)
                  if (event.type === "start") {
                    handlers.onStart?.(event)
                  } else if (event.type === "chunk") {
                    handlers.onChunk(event)
                  } else if (event.type === "end") {
                    handlers.onEnd(event)
                    return
                  } else if (event.type === "error") {
                    handlers.onError(event)
                    return
                  }
                } catch (parseError) {
                  console.error("Failed to parse SSE event:", parseError, "Data:", data)
                }
              }
            }
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE events (events are separated by \n\n)
        const events = buffer.split("\n\n")
        // Keep the last incomplete event in buffer
        buffer = events.pop() || ""

        for (const eventText of events) {
          if (!eventText.trim()) continue

          const dataLine = eventText.split("\n").find((line) => line.startsWith("data: "))
          if (dataLine) {
            const data = dataLine.slice(6) // Remove "data: " prefix
            try {
              const event: StreamEvent = JSON.parse(data)

              if (event.type === "start") {
                handlers.onStart?.(event)
              } else if (event.type === "chunk") {
                handlers.onChunk(event)
              } else if (event.type === "end") {
                handlers.onEnd(event)
                return // Stream completed successfully
              } else if (event.type === "error") {
                handlers.onError(event)
                return // Stream ended with error
              }
            } catch (parseError) {
              console.error("Failed to parse SSE event:", parseError, "Data:", data)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
    // biome-ignore lint/suspicious/noExplicitAny: Error handling
  } catch (error: any) {
    throw new Error("Fail to stream", error)
  }
}
