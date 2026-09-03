import type { Repository } from "typeorm"
import type { AgentMessage } from "./agent-message.entity"

/**
 * How long an assistant message may stay in "streaming" before it is considered orphaned.
 *
 * A stream survives its client: a page refresh closes the SSE connection but the server keeps
 * generating and settles the message on its own. Only a server that died mid-reply leaves the
 * row streaming for good, and nothing distinguishes that from a slow multi-tool turn except
 * time, so the window is generous.
 */
export const STREAM_TIMEOUT_MS = 5 * 60 * 1000

export function isStreamStale(message: AgentMessage, now: number = Date.now()): boolean {
  if (message.status !== "streaming" || !message.startedAt) return false
  const startedAt =
    message.startedAt instanceof Date ? message.startedAt : new Date(message.startedAt)
  return now - startedAt.getTime() > STREAM_TIMEOUT_MS
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
