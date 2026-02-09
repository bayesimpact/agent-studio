import { buildEndpointRequestWithOrganizationAndProject } from "@/common/test/request.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { resourceFactory } from "@/domains/resources/resource.factory"
import { resourcesControllerTestSetup } from "./test-setup"

const getTestContext = resourcesControllerTestSetup()

describe("ResourcesController - getAll", () => {
  it("should return resources for a project", async () => {
    const testContext = getTestContext()
    const { controller, resourceRepository } = testContext
    const { organization, user, project } = await createOrganizationWithProject(testContext, {
      membership: { role: "owner" },
    })
    const mockRequest = buildEndpointRequestWithOrganizationAndProject(organization, user, project)

    // Create resources
    const resource1 = resourceFactory.transient({ project }).build({
      title: "Resource 1",
      fileName: "file1.pdf",
    })
    const resource2 = resourceFactory.transient({ project }).build({
      title: "Resource 2",
      fileName: "file2.pdf",
    })
    await resourceRepository.save([resource1, resource2])

    const { data: result } = await controller.getAll(mockRequest)

    expect(result).toHaveLength(2)
    expect(result.map((resource) => resource.title)).toContain("Resource 1")
    expect(result.map((resource) => resource.title)).toContain("Resource 2")
    expect(result[0]).toHaveProperty("id")
    expect(result[0]).toHaveProperty("createdAt")
    expect(result[0]).toHaveProperty("updatedAt")
  })

  it("should return empty array when project has no resources", async () => {
    const testContext = getTestContext()
    const { controller } = testContext
    const { organization, user, project } = await createOrganizationWithProject(testContext, {
      membership: { role: "owner" },
    })
    const mockRequest = buildEndpointRequestWithOrganizationAndProject(organization, user, project)

    const { data: result } = await controller.getAll(mockRequest)

    expect(result).toEqual([])
  })
})
