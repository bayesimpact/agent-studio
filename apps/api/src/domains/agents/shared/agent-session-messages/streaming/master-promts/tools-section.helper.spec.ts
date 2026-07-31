import { ToolName } from "@caseai-connect/api-contracts"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
import { promptHelpers } from "./helpers"

const agentSettings = {} as AgentSettings

describe("promptHelpers.tools", () => {
  it("lists EVERY declared tool, the mandatory one included, with a description line", () => {
    const section = promptHelpers.tools({
      agentSettings,
      names: [ToolName.MandatoryTool, ToolName.LookupKnowledgeBase],
    })

    expect(section).toContain("## Tools:")
    expect(section).toContain(`[${ToolName.LookupKnowledgeBase}]:`)
    expect(section).toContain(`[${ToolName.MandatoryTool}]:`)
    // The line POINTS to the protocol (prompt epilogue) instead of
    // repeating its imperative — no duplicated instruction.
    expect(section).toContain('see the "Response protocol" section')
    expect(section).not.toContain("EVERY response you produce")
  })

  it("still renders the section when the only tool is the mandatory one (never an empty header)", () => {
    const section = promptHelpers.tools({
      agentSettings,
      names: [ToolName.MandatoryTool],
    })

    expect(section).toContain("## Tools:")
    expect(section).toContain(`[${ToolName.MandatoryTool}]: mandatory bookkeeping report`)
  })
})
