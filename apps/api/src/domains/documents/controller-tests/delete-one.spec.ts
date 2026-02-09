import { buildEndpointRequestWithOrganizationAndProjectAndDocument } from "@/common/test/request.factory"
import { documentFactory } from "@/domains/documents/document.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import type { Document } from "../document.entity"
import { documentsControllerTestSetup } from "./test-setup"

const getTestContext = documentsControllerTestSetup()

describe("DocumentsController - deleteOne", () => {
  describe("user is owner", () => {
    it("should delete a document", async () => {
      const testContext = getTestContext()
      const { controller, documentRepository } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "owner" },
      })

      const document = documentFactory.transient({ project }).build({
        title: "Document to delete",
        fileName: "file.pdf",
      })
      await documentRepository.save(document)

      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndDocument({
        organization,
        user,
        project,
        document,
      })

      const { data: result } = await controller.deleteOne(mockRequest)

      expect(result.success).toBe(true)

      const deletedDocument = await documentRepository.findOne({
        where: { id: document.id },
      })
      expect(deletedDocument).toBeNull()
    })
  })

  describe("user is admin", () => {
    it("should delete a document", async () => {
      const testContext = getTestContext()
      const { controller, documentRepository } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "admin" },
      })

      const document = documentFactory.transient({ project }).build({
        title: "Document to delete",
        fileName: "file.pdf",
      })
      await documentRepository.save(document)

      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndDocument({
        organization,
        user,
        project,
        document,
      })
      const { data: result } = await controller.deleteOne(mockRequest)

      expect(result.success).toBe(true)

      const deletedDocument = await documentRepository.findOne({
        where: { id: document.id },
      })
      expect(deletedDocument).toBeNull()
    })
  })

  describe("document does not exist", () => {
    it("should throw NotFoundException", async () => {
      const testContext = getTestContext()
      const { controller } = testContext
      const { organization, user, project } = await createOrganizationWithProject(testContext, {
        membership: { role: "owner" },
      })
      const mockRequest = buildEndpointRequestWithOrganizationAndProjectAndDocument({
        organization,
        user,
        project,
        document: {} as unknown as Document,
      })

      await expect(controller.deleteOne(mockRequest)).rejects.toThrow("Document ID is required.")
    })
  })
})
