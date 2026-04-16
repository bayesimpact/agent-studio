import { DocumentsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithDocument } from "@/domains/organizations/organization.factory"
import type { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import { expectResponse, type Requester, testRequester } from "../../../../test/request"
import { DocumentsModule } from "../documents.module"
import { withDocumentAuthAndEmbeddingsMocks } from "../test-overrides"

describe("Documents - getTemporaryUrl", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string
  let projectId: string
  let documentId: string
  let storagePath: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [DocumentsModule],
      applyOverrides: (moduleBuilder) =>
        withDocumentAuthAndEmbeddingsMocks(moduleBuilder, () => auth0Id),
    })
    repositories = setup.getAllRepositories()
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await app.close()
  })

  const createContext = async (projectMembership?: Partial<ProjectMembership>) => {
    const { user, organization, project, document } = await createOrganizationWithDocument(
      repositories,
      {
        projectMembership,
        document: {
          storageRelativePath: "org-id/project-id/file-id.pdf",
        },
      },
    )
    organizationId = organization.id
    projectId = project.id
    documentId = document.id
    storagePath = document.storageRelativePath
    auth0Id = user.auth0Id
    return { organization, project, document }
  }

  const subject = async () =>
    request({
      route: DocumentsRoutes.getTemporaryUrl,
      pathParams: removeNullish({ organizationId, projectId, documentId }),
      token: accessToken,
    })

  it("should return a temporary URL for a document", async () => {
    await createContext()

    const response = await subject()

    expectResponse(response, 201)
    const { url } = response.body.data
    expect(url).toBeDefined()
    expect(typeof url).toBe("string")
    expect(url).toContain(storagePath)
  })
  it("should return a temporary URL for a document for a simple member", async () => {
    await createContext({ role: "member" })

    const response = await subject()

    expectResponse(response, 201)
    const { url } = response.body.data
    expect(url).toBeDefined()
    expect(typeof url).toBe("string")
    expect(url).toContain(storagePath)
  })
})
