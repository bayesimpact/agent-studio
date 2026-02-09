import { buildEndpointRequestWithOrganizationAndProject } from "@/common/test/request.factory"

import { documentFactory } from "@/domains/documents/document.factory"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { documentsControllerTestSetup } from "./test-setup"

const getTestContext = documentsControllerTestSetup()

describe("DocumentsController - getAll", () => {
  it("should return documents for a project", async () => {
    const testContext = getTestContext()
    const { controller, documentRepository } = testContext
    const { organization, user, project } = await createOrganizationWithProject(testContext, {
      membership: { role: "owner" },
    })
    const mockRequest = buildEndpointRequestWithOrganizationAndProject(organization, user, project)

    // Create documents
    const document1 = documentFactory.transient({ project }).build({
      title: "Document 1",
      fileName: "file1.pdf",
    })
    const document2 = documentFactory.transient({ project }).build({
      title: "Document 2",
      fileName: "file2.pdf",
    })
    await documentRepository.save([document1, document2])

    const { data: result } = await controller.getAll(mockRequest)

    expect(result).toHaveLength(2)
    expect(result.map((document) => document.title)).toContain("Document 1")
    expect(result.map((document) => document.title)).toContain("Document 2")
    expect(result[0]).toHaveProperty("id")
    expect(result[0]).toHaveProperty("createdAt")
    expect(result[0]).toHaveProperty("updatedAt")
  })

  it("should return empty array when project has no documents", async () => {
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
