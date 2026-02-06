import { buildEndpointRequestWithOrganizationAndProjectAndResource } from "@/common/test/request.factory"
import { createOrganizationWithProject } from "@/organizations/organization.factory"
import { resourceFactory } from "@/resources/resource.factory"
import type { Resource } from "../resource.entity"
import { resourcesControllerTestSetup } from "./test-setup"

const getTestContext = resourcesControllerTestSetup()

describe("ResourcesController - deleteOne", () => {
  describe("user is owner", () => {
    it("should delete a resource", async () => {
      const testContext = getTestContext()
      const { controller, resourceRepository } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "owner" },
      })

      const resource = resourceFactory.transient({ project }).build({
        title: "Resource to delete",
        fileName: "file.pdf",
      })
      await resourceRepository.save(resource)

      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndResource({
        organization,
        user,
        project,
        resource,
      })

      const { data: result } = await controller.deleteOne(mockRequest)

      expect(result.success).toBe(true)

      const deletedResource = await resourceRepository.findOne({
        where: { id: resource.id },
      })
      expect(deletedResource).toBeNull()
    })
  })

  describe("user is admin", () => {
    it("should delete a resource", async () => {
      const testContext = getTestContext()
      const { controller, resourceRepository } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "admin" },
      })

      const resource = resourceFactory.transient({ project }).build({
        title: "Resource to delete",
        fileName: "file.pdf",
      })
      await resourceRepository.save(resource)

      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndResource({
        organization,
        user,
        project,
        resource,
      })
      const { data: result } = await controller.deleteOne(mockRequest)

      expect(result.success).toBe(true)

      const deletedResource = await resourceRepository.findOne({
        where: { id: resource.id },
      })
      expect(deletedResource).toBeNull()
    })
  })

  describe("resource does not exist", () => {
    it("should throw NotFoundException", async () => {
      const testContext = getTestContext()
      const { controller } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "owner" },
      })
      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndResource({
        organization,
        user,
        project,
        resource: {} as unknown as Resource,
      })

      await expect(controller.deleteOne(mockRequest)).rejects.toThrow("Resource ID is required.")
    })
  })
})
