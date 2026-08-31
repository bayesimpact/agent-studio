import { NotFoundException } from "@nestjs/common"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { documentFactory } from "../document.factory"
import { documentsServiceTestSetup } from "./test-setup"

const getTestContext = documentsServiceTestSetup()

describe("updatePdfPageCount", () => {
  it("should persist the rendered page count on the document", async () => {
    const { service, repositories } = getTestContext()

    const { organization, project } = await createOrganizationWithProject(repositories)

    const document = documentFactory.transient({ organization, project }).build({
      title: "PDF document",
      fileName: "file.pdf",
    })
    await repositories.documentRepository.save(document)

    await service.updatePdfPageCount({
      connectScope: { organizationId: organization.id, projectId: project.id },
      documentId: document.id,
      pdfPageCount: 3,
    })

    const updatedDocument = await repositories.documentRepository.findOne({
      where: { id: document.id },
    })
    expect(updatedDocument?.pdfPageCount).toBe(3)
  })

  it("should throw NotFoundException when document does not exist", async () => {
    const { service, repositories } = getTestContext()

    const { organization, project } = await createOrganizationWithProject(repositories)

    await expect(
      service.updatePdfPageCount({
        connectScope: { organizationId: organization.id, projectId: project.id },
        documentId: "00000000-0000-0000-0000-000000000000",
        pdfPageCount: 3,
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it("should throw NotFoundException when document belongs to another project", async () => {
    const { service, repositories } = getTestContext()

    const firstContext = await createOrganizationWithProject(repositories)
    const secondContext = await createOrganizationWithProject(repositories)

    const document = documentFactory
      .transient({ organization: firstContext.organization, project: firstContext.project })
      .build({ title: "PDF document", fileName: "file.pdf" })
    await repositories.documentRepository.save(document)

    await expect(
      service.updatePdfPageCount({
        connectScope: {
          organizationId: secondContext.organization.id,
          projectId: secondContext.project.id,
        },
        documentId: document.id,
        pdfPageCount: 3,
      }),
    ).rejects.toThrow(NotFoundException)

    const unchangedDocument = await repositories.documentRepository.findOne({
      where: { id: document.id },
    })
    expect(unchangedDocument?.pdfPageCount).toBeNull()
  })
})
