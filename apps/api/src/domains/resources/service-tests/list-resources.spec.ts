import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { resourceFactory } from "../resource.factory"
import { resourcesServiceTestSetup } from "./test-setup"

const getTestContext = resourcesServiceTestSetup()

describe("listResources", () => {
  it("should return resources for a project", async () => {
    const {
      service,
      resourceRepository,
      projectRepository,
      organizationRepository,
      membershipRepository,
      userRepository,
    } = getTestContext()

    const { project } = await createOrganizationWithProject({
      organizationRepository,
      userRepository,
      membershipRepository,
      projectRepository,
    })

    const resource1 = resourceFactory.transient({ project }).build({
      title: "Resource 1",
      fileName: "file1.pdf",
    })
    const resource2 = resourceFactory.transient({ project }).build({
      title: "Resource 2",
      fileName: "file2.pdf",
    })
    const deletedResource = resourceFactory.transient({ project }).build({
      title: "Deleted Resource",
      fileName: "file2.pdf",
      deletedAt: new Date(),
    })
    await resourceRepository.save([resource1, resource2, deletedResource])

    const result = await service.listResources({ projectId: project.id })

    expect(result).toHaveLength(2)
    expect(result.map((r) => r.title)).toContain("Resource 1")
    expect(result.map((r) => r.title)).toContain("Resource 2")
  })
})
