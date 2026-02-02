import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithProject } from "@/organizations/organization.factory"
import { projectFactory } from "@/projects/project.factory"
import { userFactory } from "@/users/user.factory"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBotsController - getAll", () => {
  it("should return chat bots for a project", async () => {
    const { controller, chatBotRepository } = getTestContext()
    const { user, project } = await createOrganizationWithProject(getTestContext(), {
      membership: { role: "member" },
    })
    const mockRequest = buildEndpointRequest(user)

    // Create chat bots
    const chatBot1 = chatBotFactory.transient({ project }).build({
      name: "ChatBot 1",
      defaultPrompt: "Prompt 1",
    })
    const chatBot2 = chatBotFactory.transient({ project }).build({
      name: "ChatBot 2",
      defaultPrompt: "Prompt 2",
    })
    await chatBotRepository.save([chatBot1, chatBot2])

    const { data: result } = await controller.getAll(mockRequest, project.id)

    expect(result.chatBots).toHaveLength(2)
    expect(result.chatBots.map((chatBot) => chatBot.name)).toContain("ChatBot 1")
    expect(result.chatBots.map((chatBot) => chatBot.name)).toContain("ChatBot 2")
    expect(result.chatBots[0]).toHaveProperty("id")
    expect(result.chatBots[0]).toHaveProperty("createdAt")
    expect(result.chatBots[0]).toHaveProperty("updatedAt")
  })

  it("should return empty array when project has no chat bots", async () => {
    const { controller } = getTestContext()
    const { user, project } = await createOrganizationWithProject(getTestContext(), {
      membership: { role: "member" },
    })
    const mockRequest = buildEndpointRequest(user)

    const { data: result } = await controller.getAll(mockRequest, project.id)

    expect(result.chatBots).toEqual([])
  })

  it("should throw ForbiddenException when user is not a member", async () => {
    const { controller, projectRepository, userRepository, organization } = getTestContext()

    const user = userFactory.build({
      auth0Id: "auth0|chat-bot-ctrl-nonmember",
      email: "nonmember@example.com",
    })
    await userRepository.save(user)
    const mockRequest = buildEndpointRequest(user)

    const project = projectFactory.transient({ organization }).build({
      name: "Other Project",
    })
    const savedProject = await projectRepository.save(project)

    await expect(controller.getAll(mockRequest, savedProject.id)).rejects.toThrow(
      "User does not have access to organization",
    )
  })
})
