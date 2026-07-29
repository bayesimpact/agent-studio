import "dotenv/config"
import { ToolName } from "@caseai-connect/api-contracts"
import { PROVIDER_CASES } from "./provider-cases"
import { HANDBOOK_DOCUMENT_ID, runTurnSummaryScenario } from "./turn-summary-scenario"

/**
 * Centralized LIVE reliability suite, one production-shaped RAG turn per
 * provider/model: the model must answer the user (grounded on the handbook
 * fixture) and the submit_turn_summary bookkeeping must execute EXACTLY once
 * — voluntarily during the loop or through the forced end-of-turn generation.
 *
 * Run it with (NODE_OPTIONS required by google-auth dynamic imports):
 *
 *   LIVE_PROVIDER_REGRESSIONS=1 NODE_OPTIONS=--experimental-vm-modules \
 *     npx jest --runInBand --forceExit src/external/llm/providers/live-regressions
 */
const runLive = process.env.LIVE_PROVIDER_REGRESSIONS === "1"
const describeLive = runLive ? describe : describe.skip

const LIVE_TIMEOUT_MS = 180_000

describeLive("Turn summary reliability across providers (LIVE)", () => {
  for (const providerCase of PROVIDER_CASES) {
    const reason = runLive ? providerCase.unavailableReason() : null
    const testFn = reason ? it.skip : it

    testFn(
      `${providerCase.label}${reason ? ` — SKIPPED: ${reason}` : ""} — answers AND executes submit_turn_summary exactly once`,
      async () => {
        const { text, toolExecutions } = await runTurnSummaryScenario({
          provider: providerCase.buildProvider(),
          model: providerCase.model,
        })

        // The user got a grounded answer.
        expect(text.trim().length).toBeGreaterThan(0)
        expect(text).toContain("27")

        // The turn summary executed exactly once (dedupe: voluntary + forced
        // must never both run), with the REAL chunk UUID resolved from the
        // alias, and the session categorization dispatched.
        const sourcesLogs = toolExecutions.filter(
          (toolExecution) => toolExecution.toolName === ToolName.Sources,
        )
        const metadataLogs = toolExecutions.filter(
          (toolExecution) =>
            toolExecution.toolName === ToolName.RecalculateConversationSessionMetadata,
        )
        expect(metadataLogs).toHaveLength(1)
        expect(sourcesLogs).toHaveLength(1)
        const sources = sourcesLogs[0]?.arguments.sources as Array<{ documentId: string }>
        expect(sources[0]?.documentId).toBe(HANDBOOK_DOCUMENT_ID)
      },
      LIVE_TIMEOUT_MS,
    )
  }
})
