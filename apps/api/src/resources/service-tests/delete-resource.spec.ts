import { NotFoundException } from "@nestjs/common"
import { createOrganizationWithProject } from "@/organizations/organization.factory"
import { resourceFactory } from "../resource.factory"
import { resourcesServiceTestSetup } from "./test-setup"

const getTestContext = resourcesServiceTestSetup()

describe("deleteResource", () => {
  it("should delete a resource for a project", async () => {
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

    const resource = resourceFactory.transient({ project }).build({
      title: "Resource to delete",
      fileName: "file.pdf",
    })
    await resourceRepository.save(resource)

    await service.deleteResource({ resourceId: resource.id })

    const deletedResource = await resourceRepository.findOne({
      where: { id: resource.id },
    })
    expect(deletedResource).toBeNull()
  })

  it("should throw NotFoundException when resource does not exist", async () => {
    const {
      service,
      projectRepository,
      organizationRepository,
      membershipRepository,
      userRepository,
    } = getTestContext()

    await createOrganizationWithProject({
      organizationRepository,
      userRepository,
      membershipRepository,
      projectRepository,
    })

    const nonExistentResourceId = "00000000-0000-0000-0000-000000000000"

    await expect(service.deleteResource({ resourceId: nonExistentResourceId })).rejects.toThrow(
      NotFoundException,
    )
  })
})
