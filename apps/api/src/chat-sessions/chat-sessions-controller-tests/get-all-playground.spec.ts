import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { chatSessionFactory } from "@/chat-sessions/chat-session.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatSessionsControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionsControllerTestSetup()

describe("getAllPlayground", () => {
  it("should return all playground sessions for a chatbot and user", async () => {
    const {
      controller,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      chatSessionRepository,
      organization,
    } = getTestContext()

    const auth0Sub = "auth0|get-all-playground"

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "playground@example.com",
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
      role: "admin",
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

    // Create multiple playground sessions
    const session1 = chatSessionFactory.build({
      chatbotId: savedChatBot.id,
      userId: savedUser.id,
      organizationId: organization.id,
      type: "playground",
      createdAt: new Date("2026-01-01T10:00:00Z"),
    })

    const session2 = chatSessionFactory.build({
      chatbotId: savedChatBot.id,
      userId: savedUser.id,
      organizationId: organization.id,
      type: "playground",
      createdAt: new Date("2026-01-02T10:00:00Z"),
    })

    // Create an app-private session (should not be returned)
    const appSession = chatSessionFactory.build({
      chatbotId: savedChatBot.id,
      userId: savedUser.id,
      organizationId: organization.id,
      type: "app-private",
      createdAt: new Date("2026-01-03T10:00:00Z"),
    })

    await chatSessionRepository.save([session1, session2, appSession])

    const { data: result } = await controller.getAllPlayground(mockRequest, savedChatBot.id)

    expect(result).toHaveLength(2)
    expect(result.every((s) => s.type === "playground")).toBe(true)
    expect(result.every((s) => s.chatbotId === savedChatBot.id)).toBe(true)
  })

  it("should return empty array when no playground sessions exist", async () => {
    const {
      controller,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      organization,
    } = getTestContext()

    const auth0Sub = "auth0|get-all-playground-empty"

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "playground-empty@example.com",
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
      role: "admin",
      organization,
      user: savedUser,
    })
    await membershipRepository.save(membership)

    const project = projectFactory.build({
      name: "Empty Project",
      organizationId: organization.id,
    })
    const savedProject = await projectRepository.save(project)

    const chatBot = chatBotFactory.build({
      name: "Empty Bot",
      defaultPrompt: "You are a helpful assistant",
      projectId: savedProject.id,
    })
    const savedChatBot = await chatBotRepository.save(chatBot)

    const { data: result } = await controller.getAllPlayground(mockRequest, savedChatBot.id)

    expect(result).toEqual([])
  })

  it("should return sessions in descending order by creation date", async () => {
    const {
      controller,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      chatSessionRepository,
      organization,
    } = getTestContext()

    const auth0Sub = "auth0|get-all-playground-order"

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "playground-order@example.com",
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
      role: "admin",
      organization,
      user: savedUser,
    })
    await membershipRepository.save(membership)

    const project = projectFactory.build({
      name: "Order Project",
      organizationId: organization.id,
    })
    const savedProject = await projectRepository.save(project)

    const chatBot = chatBotFactory.build({
      name: "Order Bot",
      defaultPrompt: "You are a helpful assistant",
      projectId: savedProject.id,
    })
    const savedChatBot = await chatBotRepository.save(chatBot)

    const oldSession = chatSessionFactory.build({
      chatbotId: savedChatBot.id,
      userId: savedUser.id,
      organizationId: organization.id,
      type: "playground",
      createdAt: new Date("2026-01-01T10:00:00Z"),
    })

    const newestSession = chatSessionFactory.build({
      chatbotId: savedChatBot.id,
      userId: savedUser.id,
      organizationId: organization.id,
      type: "playground",
      createdAt: new Date("2026-01-30T10:00:00Z"),
    })

    await chatSessionRepository.save([oldSession, newestSession])

    const { data: result } = await controller.getAllPlayground(mockRequest, savedChatBot.id)

    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe(newestSession.id)
    expect(result[1]?.id).toBe(oldSession.id)
  })
})
