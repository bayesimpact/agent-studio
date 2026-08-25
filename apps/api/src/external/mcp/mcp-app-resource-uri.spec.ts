import { getMcpAppResourceUri } from "./mcp-app-resource-uri"

describe("getMcpAppResourceUri", () => {
  it("detects nested _meta.ui.resourceUri", () => {
    expect(
      getMcpAppResourceUri({
        _meta: { ui: { resourceUri: "ui://patient-summary/mcp-app.html" } },
      }),
    ).toBe("ui://patient-summary/mcp-app.html")
  })

  it("detects the legacy _meta['ui/resourceUri'] key", () => {
    expect(
      getMcpAppResourceUri({
        _meta: { "ui/resourceUri": "ui://legacy/app.html" },
      }),
    ).toBe("ui://legacy/app.html")
  })

  it("prefers the nested form when both are present", () => {
    expect(
      getMcpAppResourceUri({
        _meta: {
          ui: { resourceUri: "ui://nested/app.html" },
          "ui/resourceUri": "ui://legacy/app.html",
        },
      }),
    ).toBe("ui://nested/app.html")
  })

  it("returns undefined for tools without metadata", () => {
    expect(getMcpAppResourceUri({ name: "search" })).toBeUndefined()
    expect(getMcpAppResourceUri({ _meta: {} })).toBeUndefined()
    expect(getMcpAppResourceUri(undefined)).toBeUndefined()
  })

  it("ignores URIs that are not ui:// resource identifiers", () => {
    expect(
      getMcpAppResourceUri({
        _meta: { ui: { resourceUri: "https://example.com/app.html" } },
      }),
    ).toBeUndefined()
  })
})
