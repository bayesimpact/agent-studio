import type { AgentMessage } from "./agent-message.entity"
import { isStreamStale, STREAM_TIMEOUT_MS } from "./stream-recovery"

const now = Date.UTC(2026, 8, 4, 12, 0, 0)
const minutesAgo = (minutes: number) => new Date(now - minutes * 60 * 1000)

const streamingMessage = (overrides: Partial<AgentMessage>): AgentMessage =>
  ({
    status: "streaming",
    startedAt: minutesAgo(10),
    updatedAt: minutesAgo(10),
    ...overrides,
  }) as AgentMessage

describe("isStreamStale", () => {
  it("is stale once nothing has been written for the whole window", () => {
    expect(isStreamStale(streamingMessage({}), now)).toBe(true)
  })

  it("is live while the stream keeps touching the row, however long ago it started", () => {
    // A multi-tool turn can run well past the window; its tool persists and heartbeats keep
    // bumping `updatedAt`, which is what tells it apart from an orphaned row.
    expect(isStreamStale(streamingMessage({ updatedAt: minutesAgo(1) }), now)).toBe(false)
  })

  it("is live right at the window edge", () => {
    const edge = new Date(now - STREAM_TIMEOUT_MS)
    expect(isStreamStale(streamingMessage({ startedAt: edge, updatedAt: edge }), now)).toBe(false)
  })

  it("never flags a settled message", () => {
    expect(isStreamStale(streamingMessage({ status: "completed" }), now)).toBe(false)
    expect(isStreamStale(streamingMessage({ status: "aborted" }), now)).toBe(false)
  })

  it("never flags a message that has no start", () => {
    expect(isStreamStale(streamingMessage({ startedAt: null }), now)).toBe(false)
  })
})
