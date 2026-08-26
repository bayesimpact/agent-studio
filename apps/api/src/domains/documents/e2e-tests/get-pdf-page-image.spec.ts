import { randomUUID } from "node:crypto"
import { DocumentsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import type { App } from "supertest/types"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import type { Organization } from "@/domains/organizations/organization.entity"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import type { Project } from "@/domains/projects/project.entity"
import { setupUserGuardForTesting } from "../../../../test/e2e.helpers"
import type { Document } from "../document.entity"
import { documentFactory } from "../document.factory"
import { DocumentsModule } from "../documents.module"
import { withDocumentEmbeddingsBatchServiceMock } from "../test-overrides"

describe("DocumentsRoutes.getPdfPageImage (public)", () => {
  // 1. INFRASTRUCTURE VARIABLES
  let app: INestApplication<App>
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  // 2. MUTABLE STATE
  let auth0Id = "auth0|123"

  // 3. LIFECYCLE HOOKS
  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [DocumentsModule],
      applyOverrides: (moduleBuilder) =>
        setupUserGuardForTesting(
          withDocumentEmbeddingsBatchServiceMock(moduleBuilder),
          () => auth0Id,
        ),
    })
    repositories = setup.getAllRepositories()
    app = setup.module.createNestApplication()
    await app.init()
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await app.close()
  })

  // 4. CONTEXT HELPER
  const seedDocument = async (
    overrides: Partial<Document> = {},
  ): Promise<{ organization: Organization; project: Project; document: Document }> => {
    const { organization, project } = await createOrganizationWithProject(repositories)
    const documentId = randomUUID()
    const document = documentFactory.transient({ organization, project }).build({
      id: documentId,
      storageRelativePath: `${organization.id}/${project.id}/${documentId}.pdf`,
      mimeType: "application/pdf",
      sourceType: "extraction",
      pdfPageCount: 3,
      ...overrides,
    })
    await repositories.documentRepository.save(document)
    return { organization, project, document }
  }

  // 5. SUBJECT
  const subject = ({
    organizationId,
    projectId,
    documentId,
    pageNumber,
  }: {
    organizationId: string
    projectId: string
    documentId: string
    pageNumber: string
  }) => {
    const path = DocumentsRoutes.getPdfPageImage.getPath({
      organizationId,
      projectId,
      documentId,
      pageNumber,
    })
    return supertest(app.getHttpServer()).get(path).redirects(0)
  }

  // 6. TESTS
  it("redirects to the signed url of the rendered page image", async () => {
    const { organization, project, document } = await seedDocument()

    const response = await subject({
      organizationId: organization.id,
      projectId: project.id,
      documentId: document.id,
      pageNumber: "2",
    })

    expect(response.status).toBe(302)
    expect(response.headers.location).toContain(
      `/${organization.id}/${project.id}/derived/${document.id}/page-2.png`,
    )
  })

  it("returns 404 when the document belongs to another project", async () => {
    const { organization, document } = await seedDocument()
    const { project: otherProject } = await createOrganizationWithProject(repositories)

    const response = await subject({
      organizationId: organization.id,
      projectId: otherProject.id,
      documentId: document.id,
      pageNumber: "1",
    })

    expect(response.status).toBe(404)
  })

  it("returns 404 when pdfPageCount is null (not rendered yet)", async () => {
    const { organization, project, document } = await seedDocument({ pdfPageCount: null })

    const response = await subject({
      organizationId: organization.id,
      projectId: project.id,
      documentId: document.id,
      pageNumber: "1",
    })

    expect(response.status).toBe(404)
  })

  it.each(["0", "4", "abc"])("returns 404 when pageNumber is %s", async (pageNumber) => {
    const { organization, project, document } = await seedDocument()

    const response = await subject({
      organizationId: organization.id,
      projectId: project.id,
      documentId: document.id,
      pageNumber,
    })

    expect(response.status).toBe(404)
  })

  it("returns 404 when mimeType is not application/pdf", async () => {
    const { organization, project, document } = await seedDocument({ mimeType: "image/png" })

    const response = await subject({
      organizationId: organization.id,
      projectId: project.id,
      documentId: document.id,
      pageNumber: "1",
    })

    expect(response.status).toBe(404)
  })
})
