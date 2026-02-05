import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithAgent } from "@/organizations/organization.factory"
import { chatSessionsControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionsControllerTestSetup()

describe("createAppSession", () => {
  it("should create a app session when user is a member", async () => {
    const { controller } = getTestContext()
    const { user, agent } = await createOrganizationWithAgent(getTestContext())
    const mockRequest = buildEndpointRequest(user)

    const { data: result } = await controller.createAppSession(mockRequest, agent.id, {
      payload: { chatSessionType: "app-private" },
    })

    expect(result.id).toBeDefined()
    expect(result.chatBotId).toBe(agent.id)
    expect(result.type).toBe("app-private")
  })
})
