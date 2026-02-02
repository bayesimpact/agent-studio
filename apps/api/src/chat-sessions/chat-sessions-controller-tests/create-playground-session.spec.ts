import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatSessionsControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionsControllerTestSetup()

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

    const membership = userMembershipFactory
      .transient({ user: savedUser, organization: organization })
      .owner()
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

    const { data: result } = await controller.createPlaygroundSession(mockRequest, savedChatBot.id)

    expect(result.id).toBeDefined()
    expect(result.chatBotId).toBe(savedChatBot.id)
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
