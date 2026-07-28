import { type StopCondition, stepCountIs, type ToolSet } from "ai"

/**
 * Upper bound on tool-loop steps. Mirrors the AI SDK's own `ToolLoopAgent`
 * default, kept explicit because supplying `stopWhen` replaces that default.
 */
export const MAX_TOOL_LOOP_STEPS = 20

/**
 * Builds the stop conditions for an agent's tool loop.
 *
 * `terminalToolNames` lists internal side-effect tools (e.g. `sources`) whose
 * result the model has nothing to do with. Without this, every call to one of them
 * costs an extra LLM round-trip whose only job is to read an acknowledgement — and
 * the model regularly uses that turn to append noise to an answer it had already
 * finished.
 *
 * The answer has to be part of that same step. Models that cannot mix text and
 * tool calls in one step (Gemma through vLLM, for one) call the terminal tool in a
 * step of its own and answer in the next one, so stopping on a text-less step
 * would cut the turn off before the user gets an answer.
 */
export function buildToolLoopStopConditions(
  terminalToolNames: string[] = [],
): StopCondition<ToolSet>[] {
  const terminalTools = new Set(terminalToolNames)
  if (terminalTools.size === 0) return [stepCountIs(MAX_TOOL_LOOP_STEPS)]

  return [
    stepCountIs(MAX_TOOL_LOOP_STEPS),
    ({ steps }) => {
      const lastStep = steps.at(-1)
      if (!lastStep) return false
      if (!lastStep.toolCalls.some((toolCall) => terminalTools.has(toolCall.toolName))) return false
      return lastStep.text.trim().length > 0
    },
  ]
}
