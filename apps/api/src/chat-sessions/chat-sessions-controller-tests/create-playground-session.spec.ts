import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithChatBot } from "@/organizations/organization.factory"
import { chatSessionsControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionsControllerTestSetup()

describe("createPlaygroundSession", () => {
  it("should create a playground session when user is a owner", async () => {
    const { controller } = getTestContext()
    const { user, chatBot } = await createOrganizationWithChatBot(getTestContext())
    const mockRequest = buildEndpointRequest(user)

    const { data: result } = await controller.createPlaygroundSession(mockRequest, chatBot.id)

    expect(result.id).toBeDefined()
    expect(result.chatBotId).toBe(chatBot.id)
    expect(result.type).toBe("playground")
  })
  it("fails when user is a member", async () => {
    const { controller } = getTestContext()
    const { user, chatBot } = await createOrganizationWithChatBot(getTestContext(), {
      membership: { role: "member" },
    })
    const mockRequest = buildEndpointRequest(user)

    await expect(controller.createPlaygroundSession(mockRequest, chatBot.id)).rejects.toThrow()
  })
})
