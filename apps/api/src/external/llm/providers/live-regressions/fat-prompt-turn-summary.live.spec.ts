import "dotenv/config"
import { ToolName } from "@caseai-connect/api-contracts"
import { PROVIDER_CASES } from "./provider-cases"
import { runFatPromptTurnScenario } from "./turn-summary-scenario"

/**
 * LIVE no-RAG reliability suite on the anonymized fat-prompt agent (whole
 * referential in a ~9k-token system prompt, no lookup tool, strict guardrails
 * with a quoted refusal sentence), across every provider/model. This is the
 * configuration where the turn-summary call competes hardest with the
 * agent's own prompt engineering — greeting turns, link-format rules, and
 * above all the Absolute Refusal Rule which dictates an exact quoted reply.
 *
 * The contract stays the same on every case: the user gets an answer AND the
 * session categorization executes exactly once.
 *
 *   LIVE_PROVIDER_REGRESSIONS=1 NODE_OPTIONS=--experimental-vm-modules \
 *     npx jest --runInBand --forceExit src/external/llm/providers/live-regressions
 */
const runLive = process.env.LIVE_PROVIDER_REGRESSIONS === "1"
const describeLive = runLive ? describe : describe.skip

const LIVE_TIMEOUT_MS = 180_000

const USER_MESSAGE_CASES: Array<{ label: string; userMessage: string }> = [
  { label: "greeting turn", userMessage: "hello" },
  {
    label: "in-scope service question (link-format rules active)",
    userMessage: "how do I change my password?",
  },
  {
    label: "strict-refusal trigger (personal file request)",
    userMessage: "exactly how much will I receive in allowances this month?",
  },
  { label: "off-topic question", userMessage: "tell me a joke" },
]

describeLive("Fat-prompt (no RAG) turn summary reliability across providers (LIVE)", () => {
  for (const providerCase of PROVIDER_CASES) {
    const reason = runLive ? providerCase.unavailableReason() : null
    const testFn = reason ? it.skip : it

    for (const userMessageCase of USER_MESSAGE_CASES) {
      testFn(
        `${providerCase.label}${reason ? ` — SKIPPED: ${reason}` : ""} — ${userMessageCase.label} — answers AND executes submit_turn_summary exactly once`,
        async () => {
          const { text, toolExecutions } = await runFatPromptTurnScenario({
            provider: providerCase.buildProvider(),
            model: providerCase.model,
            userMessage: userMessageCase.userMessage,
          })

          expect(text.trim().length).toBeGreaterThan(0)

          const metadataLogs = toolExecutions.filter(
            (toolExecution) =>
              toolExecution.toolName === ToolName.RecalculateConversationSessionMetadata,
          )
          expect(metadataLogs).toHaveLength(1)
        },
        LIVE_TIMEOUT_MS,
      )
    }
  }
})
