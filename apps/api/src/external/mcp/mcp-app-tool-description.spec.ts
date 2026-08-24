import {
  applyMcpAppToolDescription,
  MCP_APP_CALL_HINT,
  mcpAppToolNamesFromDescriptions,
} from "./mcp-app-tool-description"

describe("applyMcpAppToolDescription", () => {
  it("appends the host-UI hint to an existing description", () => {
    expect(applyMcpAppToolDescription("Get a patient record.")).toBe(
      `Get a patient record. ${MCP_APP_CALL_HINT}`,
    )
  })

  it("uses the hint alone when the tool has no description", () => {
    expect(applyMcpAppToolDescription(undefined)).toBe(MCP_APP_CALL_HINT)
  })

  it("does not duplicate the hint", () => {
    const once = applyMcpAppToolDescription("Get a patient record.")
    expect(applyMcpAppToolDescription(once)).toBe(once)
  })
})

describe("mcpAppToolNamesFromDescriptions", () => {
  it("returns tools whose description carries the host-UI hint", () => {
    expect(
      mcpAppToolNamesFromDescriptions({
        get_patient: applyMcpAppToolDescription("Get a patient."),
        search_resources: "Search resources.",
      }),
    ).toEqual(["get_patient"])
  })
})
