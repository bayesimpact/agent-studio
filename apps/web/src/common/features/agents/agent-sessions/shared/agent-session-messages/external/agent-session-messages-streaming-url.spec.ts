import { describe, expect, it } from "vitest"
import { buildStreamUrl } from "./agent-session-messages-streaming-url"

const params = {
  baseURL: "https://api.example.test",
  organizationId: "org-1",
  projectId: "project-1",
  agentId: "agent-1",
  agentSessionId: "session-1",
}

const decodePayload = (url: string) => {
  const query = new URL(url).searchParams.get("q")
  return JSON.parse(query ?? "{}") as { payload: Record<string, unknown> }
}

describe("buildStreamUrl", () => {
  it("carries the chosen settings revision", () => {
    const url = buildStreamUrl({ ...params, content: "Hello", agentSettingsRevision: 3 })

    expect(decodePayload(url).payload.agentSettingsRevision).toBe(3)
  })

  it("omits the revision when none was chosen", () => {
    const url = buildStreamUrl({ ...params, content: "Hello" })

    expect(decodePayload(url).payload).not.toHaveProperty("agentSettingsRevision")
  })

  it("keeps the content and the attachment in the payload", () => {
    const url = buildStreamUrl({
      ...params,
      content: "Hello",
      attachmentDocumentId: "attachment-1",
    })

    expect(decodePayload(url).payload).toMatchObject({
      content: "Hello",
      attachmentDocumentId: "attachment-1",
    })
  })

  it("points at the session's stream path", () => {
    const url = buildStreamUrl({ ...params, content: "Hello" })

    expect(new URL(url).pathname).toBe(
      "/organizations/org-1/projects/project-1/agents/agent-1/agent-sessions/session-1/stream",
    )
  })
})
