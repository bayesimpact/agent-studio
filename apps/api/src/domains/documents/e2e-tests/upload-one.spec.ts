import { DocumentsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { DocumentsModule } from "../documents.module"
import { withDocumentAuthAndEmbeddingsMocks } from "../test-overrides"

describe("Documents - uploadOne", () => {
  let app: INestApplication<App>
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [DocumentsModule],
      applyOverrides: (moduleBuilder) =>
        withDocumentAuthAndEmbeddingsMocks(moduleBuilder, () => auth0Id),
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
    await teardownTestDatabase(setup)
    await app.close()
  })

  const createContext = async (role: "owner" | "admin" | "member" = "owner") => {
    const { user, organization, project } = await createOrganizationWithProject(repositories, {
      membership: { role },
    })
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id
    return { organization, project }
  }

  const subject = ({
    file,
    sourceType = "project",
  }: {
    file: { buffer: Buffer; filename: string; contentType: string }
    sourceType?: "project" | "agentSessionMessage" | "extraction"
  }) => {
    const path = DocumentsRoutes.uploadOne.getPath({ organizationId, projectId, sourceType })
    return supertest(app.getHttpServer())
      .post(path)
      .set("Authorization", "Bearer token")
      .attach("file", file.buffer, {
        filename: file.filename,
        contentType: file.contentType,
      })
  }

  //fixme Restore test
  xit("successfully uploads a PDF file", async () => {
    await createContext()

    // Minimal valid PDF (FileTypeValidator checks magic bytes, not just extension)
    const minimalPdf = "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"

    const response = await subject({
      file: {
        buffer: Buffer.from(minimalPdf),
        filename: "test-document.pdf",
        contentType: "application/pdf",
      },
    })

    expect(response.status).toBe(201)
    expect(response.body.data.fileName).toBe("test-document.pdf")
    expect(response.body.data.mimeType).toBe("application/pdf")
    expect(response.body.data.embeddingStatus).toBe("pending")
  })

  it("rejects a file with an unsupported extension", async () => {
    await createContext()

    const response = await subject({
      file: {
        buffer: Buffer.from("some text content"),
        filename: "readme.txt",
        contentType: "text/plain",
      },
    })

    expect(response.status).toBe(422)
  })

  it("forbids member upload with project source type", async () => {
    await createContext("member")

    const minimalPdf = "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"
    const response = await subject({
      sourceType: "project",
      file: {
        buffer: Buffer.from(minimalPdf),
        filename: "member-document.pdf",
        contentType: "application/pdf",
      },
    })

    expect(response.status).toBe(403)
  })
})
