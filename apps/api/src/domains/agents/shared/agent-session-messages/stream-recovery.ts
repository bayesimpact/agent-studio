import type { Repository } from "typeorm"
import type { AgentMessage } from "./agent-message.entity"

/**
 * How long a "streaming" assistant message may go without a write before it is considered
 * orphaned.
 *
 * A stream survives its client: a page refresh closes the SSE connection but the server keeps
 * generating and settles the message on its own. Only a server that died mid-reply leaves the
 * row streaming for good. A live stream keeps writing to the row (tool persists, and a heartbeat
 * every {@link STREAM_HEARTBEAT_MS}), so silence for the whole window is what marks it dead,
 * however long the turn has been running.
 */
export const STREAM_TIMEOUT_MS = 5 * 60 * 1000

/** How often a running stream touches its message so it is not taken for orphaned. */
export const STREAM_HEARTBEAT_MS = 60 * 1000

const toTime = (value: Date | string): number =>
  (value instanceof Date ? value : new Date(value)).getTime()

export function isStreamStale(message: AgentMessage, now: number = Date.now()): boolean {
  if (message.status !== "streaming" || !message.startedAt) return false
  const lastWriteAt = Math.max(toTime(message.startedAt), toTime(message.updatedAt))
  return now - lastWriteAt > STREAM_TIMEOUT_MS
}

/**
 * Marks the message as aborted when its stream is stale. Returns the message in its settled
 * state so callers can hand it straight back to the client.
 *
 * The empty content is kept and `completedAt` stays null: nothing was ever written, and the
 * client renders an aborted message as an interrupted reply, not as an answer.
 */
export async function recoverAbortedStream(
  agentMessageRepository: Repository<AgentMessage>,
  message: AgentMessage,
): Promise<AgentMessage> {
  if (!isStreamStale(message)) return message
  message.status = "aborted"
  await agentMessageRepository.save(message)
  return message
}

/** Settles every stale streaming message of a session. */
export async function recoverAbortedStreams(
  agentMessageRepository: Repository<AgentMessage>,
  sessionId: string,
): Promise<void> {
  const streamingMessages = await agentMessageRepository.find({
    where: { sessionId, role: "assistant", status: "streaming" },
  })
  for (const message of streamingMessages) {
    await recoverAbortedStream(agentMessageRepository, message)
  }
}
