const DEFAULT_CONVERSATION_RETENTION_SWEEP_QUEUE_NAME = "conversation-retention-sweep"

export const CONVERSATION_RETENTION_SWEEP_QUEUE_NAME =
  process.env.CONVERSATION_RETENTION_SWEEP_QUEUE_NAME ??
  DEFAULT_CONVERSATION_RETENTION_SWEEP_QUEUE_NAME

export const CONVERSATION_RETENTION_SWEEP_JOB_NAME = "sweep-expired-conversations"

export const CONVERSATION_RETENTION_SWEEP_SCHEDULER_ID = "conversation-retention-sweep"

/** Max sessions purged per sweep run; the next run picks up the rest. */
export const CONVERSATION_RETENTION_SWEEP_BATCH_LIMIT = 200
