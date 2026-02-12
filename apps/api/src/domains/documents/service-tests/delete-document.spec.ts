import { NotFoundException } from "@nestjs/common"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { documentFactory } from "../document.factory"
import { documentsServiceTestSetup } from "./test-setup"

const getTestContext = documentsServiceTestSetup()

describe("deleteDocument", () => {
  it("should delete a document for a project", async () => {
    const {
      service,
      documentRepository,
      projectRepository,
      organizationRepository,
      membershipRepository,
      userRepository,
    } = getTestContext()

    const { organization, project } = await createOrganizationWithProject({
      organizationRepository,
      userRepository,
      membershipRepository,
      projectRepository,
    })

    const document = documentFactory.transient({ organization, project }).build({
      title: "Document to delete",
      fileName: "file.pdf",
    })
    await documentRepository.save(document)

    await service.deleteDocument({
      connectRequiredFields: { organizationId: organization.id, projectId: project.id },
      documentId: document.id,
    })

    const deletedDocument = await documentRepository.findOne({
      where: { id: document.id },
    })
    expect(deletedDocument).toBeNull()
  })

  it("should throw NotFoundException when document does not exist", async () => {
    const {
      service,
      projectRepository,
      organizationRepository,
      membershipRepository,
      userRepository,
    } = getTestContext()

    const { organization, project } = await createOrganizationWithProject({
      organizationRepository,
      userRepository,
      membershipRepository,
      projectRepository,
    })

    const nonExistentDocumentId = "00000000-0000-0000-0000-000000000000"

    await expect(
      service.deleteDocument({
        connectRequiredFields: { organizationId: organization.id, projectId: project.id },
        documentId: nonExistentDocumentId,
      }),
    ).rejects.toThrow(NotFoundException)
  })
})
