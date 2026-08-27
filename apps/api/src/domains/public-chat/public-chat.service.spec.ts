import type { AgentMessage } from "@/domains/agents/shared/agent-session-messages/agent-message.entity"
import { mcpAppHtmlCacheKey } from "@/domains/agents/shared/agent-session-messages/agent-message.helpers"
import { publicAgentSessionFactory } from "./public-agent-sessions/public-agent-session.factory"
import { PublicChatService } from "./public-chat.service"

const resourceUri = "ui://patient-summary/mcp-app.html"
const mcpServerId = "mcp-server-1"
const html = "<html>live card</html>"
const createdAt = new Date("2026-01-01T10:00:00Z")

function buildAssistantMessage(overrides: Partial<AgentMessage> = {}): AgentMessage {
  return {
    id: "msg-1",
    role: "assistant",
    content: "Hello",
    status: "completed",
    createdAt,
    startedAt: createdAt,
    completedAt: createdAt,
    agentSettings: { revision: 1 },
    toolCalls: null,
    attachmentDocumentId: null,
    ...overrides,
  } as AgentMessage
}

describe("PublicChatService", () => {
  it("hydrates MCP App HTML onto public session toolCalls", async () => {
    const session = publicAgentSessionFactory.build({ externalVisitorId: "visitor-1" })
    const message = buildAssistantMessage({
      content: "Here is the summary.",
      toolCalls: [
        {
          id: "call-1",
          name: "get_patient",
          arguments: { patientId: "p-1" },
          result: { structuredContent: { title: "Ada" } },
          mcpApp: { mcpServerId, resourceUri },
        },
      ],
    })

    const readLiveHtml = jest
      .fn()
      .mockResolvedValue(new Map([[mcpAppHtmlCacheKey(mcpServerId, resourceUri), html]]))
    const getSessionWithMessages = jest.fn().mockResolvedValue({ session, messages: [message] })

    const service = new PublicChatService(
      {} as never,
      {} as never,
      {} as never,
      { getSessionWithMessages } as never,
      {} as never,
      { readLiveHtml } as never,
    )

    const dto = await service.getSession(session)

    expect(readLiveHtml).toHaveBeenCalledWith({
      agentId: session.agentId,
      sessionId: session.id,
      messages: [message],
      externalVisitorId: "visitor-1",
    })
    expect(dto.messages[0]?.toolCalls?.[0]?.mcpApp).toEqual({
      mcpServerId,
      resourceUri,
      html,
    })
  })

  it("omits toolCalls when the message has none", async () => {
    const session = publicAgentSessionFactory.build()
    const message = buildAssistantMessage()

    const service = new PublicChatService(
      {} as never,
      {} as never,
      {} as never,
      {
        getSessionWithMessages: jest.fn().mockResolvedValue({ session, messages: [message] }),
      } as never,
      {} as never,
      { readLiveHtml: jest.fn().mockResolvedValue(new Map()) } as never,
    )

    const dto = await service.getSession(session)

    expect(dto.messages[0]?.toolCalls).toBeUndefined()
  })
})
