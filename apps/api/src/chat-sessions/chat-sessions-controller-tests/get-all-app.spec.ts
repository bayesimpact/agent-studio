import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { chatSessionFactory } from "@/chat-sessions/chat-session.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatSessionsControllerTestSetup } from "./test-setup"

const getTestContext = chatSessionsControllerTestSetup()

describe("getAllApp", () => {
  it("should return all app-private sessions for a chatbot and user", async () => {
    const {
      controller,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      chatSessionRepository,
      organization,
    } = getTestContext()

    const auth0Sub = "auth0|get-all-app"

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "app@example.com",
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

    // Create multiple app-private sessions
    const session1 = chatSessionFactory
      .transient({ chatBot: savedChatBot, user: savedUser, organization: organization })
      .build({
        type: "app-private",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      })

    const session2 = chatSessionFactory
      .transient({ chatBot: savedChatBot, user: savedUser, organization: organization })
      .build({
        type: "app-private",
        createdAt: new Date("2026-01-02T10:00:00Z"),
      })

    // Create a playground session (should not be returned)
    const playgroundSession = chatSessionFactory
      .transient({ chatBot: savedChatBot, user: savedUser, organization: organization })
      .build({
        type: "playground",
        createdAt: new Date("2026-01-03T10:00:00Z"),
      })

    await chatSessionRepository.save([session1, session2, playgroundSession])

    const { data: result } = await controller.getAllApp(mockRequest, savedChatBot.id)

    expect(result).toHaveLength(2)
    expect(result.every((s) => s.type === "app-private")).toBe(true)
    expect(result.every((s) => s.chatbotId === savedChatBot.id)).toBe(true)
  })

  it("should return empty array when no app-private sessions exist", async () => {
    const {
      controller,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      organization,
    } = getTestContext()

    const auth0Sub = "auth0|get-all-app-empty"

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "app-empty@example.com",
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
      name: "Empty App Project",
    })
    const savedProject = await projectRepository.save(project)

    const chatBot = chatBotFactory.transient({ project: savedProject }).build({
      name: "Empty App Bot",
      defaultPrompt: "You are a helpful assistant",
    })
    const savedChatBot = await chatBotRepository.save(chatBot)

    const { data: result } = await controller.getAllApp(mockRequest, savedChatBot.id)

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

    const auth0Sub = "auth0|get-all-app-order"

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "app-order@example.com",
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
      name: "Order App Project",
    })
    const savedProject = await projectRepository.save(project)

    const chatBot = chatBotFactory.transient({ project: savedProject }).build({
      name: "Order App Bot",
      defaultPrompt: "You are a helpful assistant",
    })
    const savedChatBot = await chatBotRepository.save(chatBot)

    const oldSession = chatSessionFactory
      .transient({ chatBot: savedChatBot, user: savedUser, organization: organization })
      .build({
        type: "app-private",
        createdAt: new Date("2026-01-01T10:00:00Z"),
      })

    const newestSession = chatSessionFactory
      .transient({ chatBot: savedChatBot, user: savedUser, organization: organization })
      .build({
        type: "app-private",
        createdAt: new Date("2026-01-30T10:00:00Z"),
      })

    await chatSessionRepository.save([oldSession, newestSession])

    const { data: result } = await controller.getAllApp(mockRequest, savedChatBot.id)

    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe(newestSession.id)
    expect(result[1]?.id).toBe(oldSession.id)
  })
})
