import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { agentSessionsControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionsControllerTestSetup()

describe("createPlaygroundSession", () => {
  it("should create a playground session when user is a owner", async () => {
    const { controller } = getTestContext()
    const { user, agent } = await createOrganizationWithAgent(getTestContext())
    const mockRequest = buildEndpointRequest(user)

    const { data: result } = await controller.createPlaygroundSession(mockRequest, agent.id)

    expect(result.id).toBeDefined()
    expect(result.agentId).toBe(agent.id)
    expect(result.type).toBe("playground")
    expect(result.traceUrl).toBeDefined()
  })
  it("fails when user is a member", async () => {
    const { controller } = getTestContext()
    const { user, agent } = await createOrganizationWithAgent(getTestContext(), {
      membership: { role: "member" },
    })
    const mockRequest = buildEndpointRequest(user)

    await expect(controller.createPlaygroundSession(mockRequest, agent.id)).rejects.toThrow()
  })
})
