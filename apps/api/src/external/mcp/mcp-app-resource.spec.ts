import { MCP_APP_MIME_TYPE, McpAppResourceError, readMcpAppHtml } from "./mcp-app-resource"

const resourceUri = "ui://patient-summary/mcp-app.html"

describe("readMcpAppHtml", () => {
  it("returns HTML for a valid MCP App resource", () => {
    const html = readMcpAppHtml({
      resourceUri,
      resource: {
        contents: [
          {
            uri: resourceUri,
            mimeType: MCP_APP_MIME_TYPE,
            text: "<html><body>Patient</body></html>",
          },
        ],
      },
    })

    expect(html).toContain("Patient")
  })

  it("rejects undeclared non-ui URIs", () => {
    expect(() =>
      readMcpAppHtml({
        resourceUri: "https://evil.example/app.html",
        resource: { contents: [] },
      }),
    ).toThrow(McpAppResourceError)
  })

  it("rejects a missing resource", () => {
    expect(() =>
      readMcpAppHtml({
        resourceUri,
        resource: { contents: [] },
      }),
    ).toThrow(/not found/)
  })

  it("rejects the wrong MIME type", () => {
    expect(() =>
      readMcpAppHtml({
        resourceUri,
        resource: {
          contents: [{ uri: resourceUri, mimeType: "text/html", text: "<html></html>" }],
        },
      }),
    ).toThrow(/MIME type/)
  })

  it("rejects a malformed resource with no HTML payload", () => {
    expect(() =>
      readMcpAppHtml({
        resourceUri,
        resource: {
          contents: [{ uri: resourceUri, mimeType: MCP_APP_MIME_TYPE }],
        },
      }),
    ).toThrow(/Malformed/)
  })
})
