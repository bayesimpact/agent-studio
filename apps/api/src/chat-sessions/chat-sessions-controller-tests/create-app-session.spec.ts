import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatSessionsControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionsControllerTestSetup()

describe("createAppSession", () => {
  it("should create a app session when user is a member", async () => {
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

    const project = projectFactory.transient({ organization: organization }).build({
      name: "App Project",
    })
    const savedProject = await projectRepository.save(project)

    const chatBot = chatBotFactory.transient({ project: savedProject }).build({
      name: "App Bot",
      defaultPrompt: "You are a helpful assistant",
    })
    const savedChatBot = await chatBotRepository.save(chatBot)

    const { data: result } = await controller.createAppSession(mockRequest, savedChatBot.id, {
      payload: { chatSessionType: "app-private" },
    })

    expect(result.id).toBeDefined()
    expect(result.chatBotId).toBe(savedChatBot.id)
    expect(result.type).toBe("app-private")
    expect(result.expiresAt).toBeNull()
  })
})
