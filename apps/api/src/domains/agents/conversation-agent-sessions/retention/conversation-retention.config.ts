const DEFAULT_SWEEP_INTERVAL_SECONDS = 3600

/**
 * How often the BullMQ scheduler enqueues a retention sweep. Optional env —
 * unlike the stuck-embedding sweep the retention sweep must not crash worker
 * startup on deployments that never set it, so it falls back to hourly.
 */
export function getConversationRetentionSweepIntervalSeconds(): number {
  const rawValue = process.env.CONVERSATION_RETENTION_SWEEP_INTERVAL_SECONDS
  if (rawValue === undefined || rawValue === "") return DEFAULT_SWEEP_INTERVAL_SECONDS
  const parsed = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      "CONVERSATION_RETENTION_SWEEP_INTERVAL_SECONDS must be a positive integer (seconds).",
    )
  }
  return parsed
}
