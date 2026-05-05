function parseRequiredPositiveInt(
  environmentVariableName: string,
  unitWord: "milliseconds" | "seconds",
): number {
  const rawValue = process.env[environmentVariableName]
  if (rawValue === undefined || rawValue === "") {
    throw new Error(`${environmentVariableName} must be set to a positive integer (${unitWord}).`)
  }
  const parsed = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${environmentVariableName} must be a positive integer (${unitWord}).`)
  }
  return parsed
}

/** Max age for `queued` / `processing` before the sweep marks the document as timed out. */
export function getDocumentEmbeddingStuckThresholdSeconds(): number {
  return parseRequiredPositiveInt("DOCUMENT_EMBEDDING_STUCK_THRESHOLD_SECONDS", "seconds")
}

/** How often the BullMQ scheduler enqueues a stuck-embedding sweep job (Bull `every` uses ms internally). */
export function getDocumentEmbeddingStuckSweepIntervalSeconds(): number {
  return parseRequiredPositiveInt("DOCUMENT_EMBEDDING_STUCK_SWEEP_INTERVAL_SECONDS", "seconds")
}
