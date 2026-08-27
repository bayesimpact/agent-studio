import { ToolName } from "@caseai-connect/api-contracts"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
import { applyMcpAppToolDescription } from "@/external/mcp/mcp-app-tool-description"
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

  it("explains that MCP App tools render a UI when called", () => {
    const section = promptHelpers.mcpAppUis({
      get_patient: applyMcpAppToolDescription("Get a patient."),
      search_resources: "Search resources.",
    })

    expect(section).toContain("## Interactive tool UIs")
    expect(section).toContain("get_patient")
    expect(section).toContain("Do not recap, summarize, or restate the UI contents in markdown")
    expect(section).not.toContain("search_resources")
  })

  it("omits the MCP App section when no tool has a UI resource", () => {
    expect(promptHelpers.mcpAppUis({ search_resources: "Search resources." })).toBe("")
  })
})
