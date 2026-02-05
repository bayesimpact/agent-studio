import { agentFactory } from "@/agents/agent.factory"
import { buildEndpointRequest } from "@/common/test/request.factory"
import { createOrganizationWithProject } from "@/organizations/organization.factory"
import { projectFactory } from "@/projects/project.factory"
import { userFactory } from "@/users/user.factory"
import { agentsControllerTestSetup } from "./test-setup"

const getTestContext = agentsControllerTestSetup()

describe("AgentsController - getAll", () => {
  it("should return agents for a project", async () => {
    const { controller, agentRepository } = getTestContext()
    const { user, project } = await createOrganizationWithProject(getTestContext(), {
      membership: { role: "member" },
    })
    const mockRequest = buildEndpointRequest(user)

    // Create agents
    const agent1 = agentFactory.transient({ project }).build({
      name: "Agent 1",
      defaultPrompt: "Prompt 1",
    })
    const agent2 = agentFactory.transient({ project }).build({
      name: "Agent 2",
      defaultPrompt: "Prompt 2",
    })
    await agentRepository.save([agent1, agent2])

    const { data: result } = await controller.getAll(mockRequest, project.id)

    expect(result.agents).toHaveLength(2)
    expect(result.agents.map((agent) => agent.name)).toContain("Agent 1")
    expect(result.agents.map((agent) => agent.name)).toContain("Agent 2")
    expect(result.agents[0]).toHaveProperty("id")
    expect(result.agents[0]).toHaveProperty("createdAt")
    expect(result.agents[0]).toHaveProperty("updatedAt")
  })

  it("should return empty array when project has no agents", async () => {
    const { controller } = getTestContext()
    const { user, project } = await createOrganizationWithProject(getTestContext(), {
      membership: { role: "member" },
    })
    const mockRequest = buildEndpointRequest(user)

    const { data: result } = await controller.getAll(mockRequest, project.id)

    expect(result.agents).toEqual([])
  })

  it("should throw ForbiddenException when user is not a member", async () => {
    const { controller, projectRepository, userRepository, organization } = getTestContext()

    const user = userFactory.build({
      auth0Id: "auth0|agent-ctrl-nonmember",
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
