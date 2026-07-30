import type { ToolSet } from "ai"

/**
 * Marks every tool of the set `strict: true` WITHOUT materializing it: each
 * wrapper keeps the original tool as its prototype, so getter-based dynamic
 * properties (submit_turn_summary's per-step `description`/`inputSchema`)
 * keep being re-evaluated on every generation.
 *
 * On the ai-sdk Google/Vertex provider, a strict tool switches the request
 * to functionCallingConfig mode VALIDATED: Gemini then constrains the call
 * arguments to the declared schema (enums held even under adversarial user
 * injections — measured) while still answering with text in the same
 * generation, which neither AUTO (no validation) nor ANY (no text) offers.
 *
 * Only meant for the ANSWERING LOOP: the forced end-of-turn generation must
 * keep non-strict tools, because with a strict tool the provider maps
 * toolChoice "required" to VALIDATED too — which validates but does not
 * force, breaking the execution guarantee.
 */
export function withStrictTools(tools: ToolSet | undefined): ToolSet | undefined {
  if (!tools) return undefined
  return Object.fromEntries(
    Object.entries(tools).map(([toolName, tool]) => [
      toolName,
      Object.create(tool, { strict: { value: true, enumerable: true } }),
    ]),
  )
}
