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
    const {
      controller,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      organization,
    } = getTestContext()

    const auth0Sub = "auth0|chat-session-ctrl-member"

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "member@example.com",
    })
    const savedUser = await userRepository.save(user)

    const mockRequest = {
      user: {
        sub: auth0Sub,
        email: savedUser.email,
        id: savedUser.id,
      },
    } as EndpointRequest

    const membership = userMembershipFactory
      .transient({ user: savedUser, organization: organization })
      .member()
      .build()
    await membershipRepository.save(membership)

    const project = projectFactory
      .transient({ organization: organization })
      .build({ name: "Playground Project" })
    const savedProject = await projectRepository.save(project)

    const chatBot = chatBotFactory.transient({ project: savedProject }).build({
      name: "Playground Bot",
      defaultPrompt: "You are a helpful assistant",
    })
    const savedChatBot = await chatBotRepository.save(chatBot)

    await expect(controller.createPlaygroundSession(mockRequest, savedChatBot.id)).rejects.toThrow()
  })
})
