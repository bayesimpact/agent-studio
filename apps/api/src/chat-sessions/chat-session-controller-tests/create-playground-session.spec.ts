import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatSessionControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionControllerTestSetup()

describe("createPlaygroundSession", () => {
  it("should create a playground session when user is a owner", async () => {
    const {
      controller,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      organization,
    } = getTestContext()

    const auth0Sub = "auth0|chat-session-ctrl-owner"

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "owner@example.com",
    })
    const savedUser = await userRepository.save(user)

    const mockRequest = {
      user: {
        sub: auth0Sub,
        email: savedUser.email,
        id: savedUser.id,
      },
    } as EndpointRequest

    const membership = userMembershipFactory.build({
      userId: savedUser.id,
      organizationId: organization.id,
      role: "owner",
      organization,
      user: savedUser,
    })
    await membershipRepository.save(membership)

    const project = projectFactory.build({
      name: "Playground Project",
      organizationId: organization.id,
    })
    const savedProject = await projectRepository.save(project)

    const chatBot = chatBotFactory.build({
      name: "Playground Bot",
      defaultPrompt: "You are a helpful assistant",
      projectId: savedProject.id,
    })
    const savedChatBot = await chatBotRepository.save(chatBot)

    const { data: result } = await controller.createPlaygroundSession(mockRequest, savedChatBot.id)

    expect(result.id).toBeDefined()
    expect(result.chatbotId).toBe(savedChatBot.id)
    expect(result.type).toBe("playground")
    expect(result.expiresAt).not.toBeNull()
  })
})
