import type { StopCondition, ToolSet } from "ai"

/**
 * Stops the tool loop once the last step only invoked fire-and-forget tools —
 * logging-style tools (surfaceResources, ...) whose output the model never
 * needs. Running another generation after them would only produce an empty
 * follow-up, so skipping it saves one LLM round-trip per call.
 *
 * The loop keeps going when the step mixes fire-and-forget calls with
 * round-trip calls, and when no text was produced yet — stopping there would
 * leave the user with no answer at all.
 */
export function fireAndForgetStopCondition({
  fireAndForgetToolNames,
}: {
  fireAndForgetToolNames: string[]
}): StopCondition<ToolSet> {
  const fireAndForgetTools = new Set(fireAndForgetToolNames)
  return ({ steps }) => {
    const lastStep = steps.at(-1)
    if (!lastStep || lastStep.toolCalls.length === 0) return false
    const onlyFireAndForgetCalls = lastStep.toolCalls.every((toolCall) =>
      fireAndForgetTools.has(toolCall.toolName),
    )
    if (!onlyFireAndForgetCalls) return false
    return steps.some((step) => step.text.trim().length > 0)
  }
}
