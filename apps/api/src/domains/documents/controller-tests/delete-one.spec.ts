import { buildEndpointRequestWithOrganizationAndProjectAndDocument } from "@/common/test/request.factory"
import { documentFactory } from "@/domains/documents/document.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { documentsControllerTestSetup } from "./test-setup"

const getTestContext = documentsControllerTestSetup()

describe("DocumentsController - deleteOne", () => {
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
