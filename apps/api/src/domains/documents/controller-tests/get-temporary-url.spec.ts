import { buildEndpointRequestWithOrganizationAndProjectAndDocument } from "@/common/test/request.factory"
import { documentFactory } from "@/domains/documents/document.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { documentsControllerTestSetup } from "./test-setup"

const getTestContext = documentsControllerTestSetup()

describe("DocumentsController - getTemporaryUrl", () => {
  describe("user is owner", () => {
    it("should return a temporary URL for a document", async () => {
      const testContext = getTestContext()
      const { controller, documentRepository } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "owner" },
      })

      const document = documentFactory.transient({ project }).build({
        title: "Document with URL",
        fileName: "file.pdf",
        storageRelativePath: "org-id/project-id/file-id.pdf",
      })
      await documentRepository.save(document)

      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndDocument({
        organization,
        user,
        project,
        document,
      })

      const { data: result } = await controller.getTemporaryUrl(mockRequest)

      expect(result.url).toBeDefined()
      expect(typeof result.url).toBe("string")
      expect(result.url).toContain(document.storageRelativePath)
    })
  })

  describe("user is admin", () => {
    it("should return a temporary URL for a document", async () => {
      const testContext = getTestContext()
      const { controller, documentRepository } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "admin" },
      })

      const document = documentFactory.transient({ project }).build({
        title: "Document with URL",
        fileName: "file.pdf",
        storageRelativePath: "org-id/project-id/file-id.pdf",
      })
      await documentRepository.save(document)

      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndDocument({
        organization,
        user,
        project,
        document,
      })

      const { data: result } = await controller.getTemporaryUrl(mockRequest)

      expect(result.url).toBeDefined()
      expect(typeof result.url).toBe("string")
      expect(result.url).toContain(document.storageRelativePath)
    })
  })
})
