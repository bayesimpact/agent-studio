import { chatSessionFactory } from "@/chat-sessions/chat-session.factory"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithChatBot } from "@/organizations/organization.factory"
import { chatSessionsControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionsControllerTestSetup()

describe("getAllPlayground", () => {
  describe("when user is owner", () => {
    it("should return all playground sessions for a chatbot and user", async () => {
      const { controller, chatSessionRepository, organization } = getTestContext()
      const { user, chatBot } = await createOrganizationWithChatBot(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      // Create multiple playground sessions
      const session1 = chatSessionFactory.transient({ chatBot, user, organization }).build({
        type: "playground",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      })

      const session2 = chatSessionFactory.transient({ chatBot, user, organization }).build({
        type: "playground",
        createdAt: new Date("2026-01-02T10:00:00Z"),
      })

      // Create an app-private session (should not be returned)
      const appSession = chatSessionFactory.transient({ chatBot, user, organization }).build({
        type: "app-private",
        createdAt: new Date("2026-01-03T10:00:00Z"),
      })

      await chatSessionRepository.save([session1, session2, appSession])

      const { data: result } = await controller.getAllPlayground(mockRequest, chatBot.id)

      expect(result).toHaveLength(2)
      expect(result.every((session) => session.type === "playground")).toBe(true)
      expect(result.every((session) => session.chatBotId === chatBot.id)).toBe(true)
    })

    it("should return empty array when no playground sessions exist", async () => {
      const { controller } = getTestContext()
      const { user, chatBot } = await createOrganizationWithChatBot(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const { data: result } = await controller.getAllPlayground(mockRequest, chatBot.id)

      expect(result).toEqual([])
    })

    it("should return sessions in descending order by creation date", async () => {
      const { controller, chatSessionRepository, organization } = getTestContext()
      const { user, chatBot } = await createOrganizationWithChatBot(getTestContext())
      const mockRequest = buildEndpointRequest(user)

      const oldSession = chatSessionFactory.transient({ chatBot, user, organization }).build({
        type: "playground",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      })

      const newestSession = chatSessionFactory.transient({ chatBot, user, organization }).build({
        type: "playground",
        createdAt: new Date("2026-01-30T10:00:00Z"),
      })

      await chatSessionRepository.save([oldSession, newestSession])

      const { data: result } = await controller.getAllPlayground(mockRequest, chatBot.id)

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe(newestSession.id)
      expect(result[1]?.id).toBe(oldSession.id)
    })
  })

  describe("when user is member", () => {
    it("fails when user is member", async () => {
      const { controller, chatSessionRepository, organization } = getTestContext()
      const { user, chatBot } = await createOrganizationWithChatBot(getTestContext(), {
        membership: { role: "member" },
      })
      const mockRequest = buildEndpointRequest(user)

      // Create multiple playground sessions
      const session1 = chatSessionFactory.transient({ chatBot, user, organization }).build({
        type: "playground",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      })

      const session2 = chatSessionFactory.transient({ chatBot, user, organization }).build({
        type: "playground",
        createdAt: new Date("2026-01-02T10:00:00Z"),
      })

      // Create an app-private session (should not be returned)
      const appSession = chatSessionFactory.transient({ chatBot, user, organization }).build({
        type: "app-private",
        createdAt: new Date("2026-01-03T10:00:00Z"),
      })

      await chatSessionRepository.save([session1, session2, appSession])

      await expect(controller.getAllPlayground(mockRequest, chatBot.id)).rejects.toThrow()
    })
  })
})
