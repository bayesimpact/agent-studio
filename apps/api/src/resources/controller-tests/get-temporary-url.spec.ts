import { buildEndpointRequestWithOrganizationAndProjectAndResource } from "@/common/test/request.factory"
import { createOrganizationWithProject } from "@/organizations/organization.factory"
import { resourceFactory } from "@/resources/resource.factory"
import type { Resource } from "../resource.entity"
import { resourcesControllerTestSetup } from "./test-setup"

const getTestContext = resourcesControllerTestSetup()

describe("ResourcesController - getTemporaryUrl", () => {
  describe("user is owner", () => {
    it("should return a temporary URL for a resource", async () => {
      const testContext = getTestContext()
      const { controller, resourceRepository } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "owner" },
      })

      const resource = resourceFactory.transient({ project }).build({
        title: "Resource with URL",
        fileName: "file.pdf",
        storageRelativePath: "org-id/project-id/file-id.pdf",
      })
      await resourceRepository.save(resource)

      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndResource({
        organization,
        user,
        project,
        resource,
      })

      const { data: result } = await controller.getTemporaryUrl(mockRequest)

      expect(result.url).toBeDefined()
      expect(typeof result.url).toBe("string")
      expect(result.url).toContain(resource.storageRelativePath)
    })
  })

  describe("user is admin", () => {
    it("should return a temporary URL for a resource", async () => {
      const testContext = getTestContext()
      const { controller, resourceRepository } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "admin" },
      })

      const resource = resourceFactory.transient({ project }).build({
        title: "Resource with URL",
        fileName: "file.pdf",
        storageRelativePath: "org-id/project-id/file-id.pdf",
      })
      await resourceRepository.save(resource)

      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndResource({
        organization,
        user,
        project,
        resource,
      })

      const { data: result } = await controller.getTemporaryUrl(mockRequest)

      expect(result.url).toBeDefined()
      expect(typeof result.url).toBe("string")
      expect(result.url).toContain(resource.storageRelativePath)
    })
  })

  describe("resource does not exist", () => {
    it("should throw NotFoundException when resource ID is missing", async () => {
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

      await expect(controller.getTemporaryUrl(mockRequest)).rejects.toThrow(
        "Resource ID is required.",
      )
    })
  })
})
