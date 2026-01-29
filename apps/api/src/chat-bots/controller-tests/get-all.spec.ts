import { chatBotFactory } from "@/chat-bots/chat-bot.factory"
import { userMembershipFactory } from "@/organizations/user-membership.factory"
import { projectFactory } from "@/projects/project.factory"
import type { EndpointRequest } from "@/request.interface"
import { userFactory } from "@/users/user.factory"
import { chatBotsControllerTestSetup } from "./test-setup"

const getTestContext = chatBotsControllerTestSetup()

describe("ChatBotsController - getAll", () => {
  it("should return chat templates for a project", async () => {
    const {
      controller,
      userRepository,
      membershipRepository,
      projectRepository,
      chatBotRepository,
      organization,
    } = getTestContext()

    const auth0Sub = "auth0|chat-bot-ctrl-list"
    const mockRequest = {
      user: {
        sub: auth0Sub,
        email: "list@example.com",
      },
    } as EndpointRequest

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "list@example.com",
    })
    const savedUser = await userRepository.save(user)

    await membershipRepository.save(
      userMembershipFactory.build({
        userId: savedUser.id,
        organizationId: organization.id,
        role: "member",
        user: savedUser,
        organization,
      }),
    )

    const project = projectFactory.build({
      name: "List Project",
      organizationId: organization.id,
    })
    const savedProject = await projectRepository.save(project)

    // Create chat templates
    const template1 = chatBotFactory.build({
      name: "Template 1",
      defaultPrompt: "Prompt 1",
      projectId: savedProject.id,
    })
    const template2 = chatBotFactory.build({
      name: "Template 2",
      defaultPrompt: "Prompt 2",
      projectId: savedProject.id,
    })
    await chatBotRepository.save([template1, template2])

    const { data: result } = await controller.getAll(mockRequest, savedProject.id)

    expect(result.chatBots).toHaveLength(2)
    expect(result.chatBots.map((t) => t.name)).toContain("Template 1")
    expect(result.chatBots.map((t) => t.name)).toContain("Template 2")
    expect(result.chatBots[0]).toHaveProperty("id")
    expect(result.chatBots[0]).toHaveProperty("createdAt")
    expect(result.chatBots[0]).toHaveProperty("updatedAt")
  })

  it("should return empty array when project has no chat templates", async () => {
    const { controller, userRepository, membershipRepository, projectRepository, organization } =
      getTestContext()

    const auth0Sub = "auth0|chat-bot-ctrl-empty"
    const mockRequest = {
      user: {
        sub: auth0Sub,
        email: "empty@example.com",
      },
    } as EndpointRequest

    const user = userFactory.build({
      auth0Id: auth0Sub,
      email: "empty@example.com",
    })
    const savedUser = await userRepository.save(user)

    await membershipRepository.save(
      userMembershipFactory.build({
        userId: savedUser.id,
        organizationId: organization.id,
        role: "member",
        user: savedUser,
        organization,
      }),
    )

    const project = projectFactory.build({
      name: "Empty Project",
      organizationId: organization.id,
    })
    const savedProject = await projectRepository.save(project)

    const { data: result } = await controller.getAll(mockRequest, savedProject.id)

    expect(result.chatBots).toEqual([])
  })

  it("should throw ForbiddenException when user is not a member", async () => {
    const { controller, projectRepository, userRepository, organization } = getTestContext()

    const auth0Sub = "auth0|chat-bot-ctrl-nonmember"
    const mockRequest = {
      user: {
        sub: auth0Sub,
        email: "nonmember@example.com",
      },
    } as EndpointRequest

    await userRepository.save(
      userFactory.build({
        auth0Id: auth0Sub,
        email: "nonmember@example.com",
      }),
    )

    const project = projectFactory.build({
      name: "Other Project",
      organizationId: organization.id,
    })
    const savedProject = await projectRepository.save(project)

    await expect(controller.getAll(mockRequest, savedProject.id)).rejects.toThrow(
      "User does not have access to organization",
    )
  })
})
