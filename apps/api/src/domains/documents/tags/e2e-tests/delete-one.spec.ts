import { DocumentTagsRoutes } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { DocumentTag } from "../document-tag.entity"
import { documentTagFactory } from "../document-tag.factory"
import { DocumentTagsModule } from "../document-tags.module"

describe("DocumentTags - deleteOne", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string
  let projectId: string
  let documentTagId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [DocumentTagsModule],
      applyOverrides: (moduleBuilder) => setupUserGuardForTesting(moduleBuilder, () => auth0Id),
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
    await teardownTestDatabase(setup)
    await app.close()
  })

  const createContext = async () => {
    const { user, organization, project } = await createOrganizationWithProject(repositories)
    organizationId = organization.id
    projectId = project.id
    auth0Id = user.auth0Id

    const documentTagRepository = setup.getRepository(DocumentTag)
    const documentTag = documentTagFactory.transient({ organization, project }).build()
    await documentTagRepository.save(documentTag)
    documentTagId = documentTag.id

    return { organization, project, documentTag }
  }

  const subject = async () =>
    request({
      route: DocumentTagsRoutes.deleteOne,
      pathParams: removeNullish({ organizationId, projectId, documentTagId }),
      token: accessToken,
    })

  it("should delete a document tag and return success", async () => {
    await createContext()

    const response = await subject()

    expectResponse(response, 200)
    expect(response.body.data.success).toBe(true)

    const documentTagRepository = setup.getRepository(DocumentTag)
    const deleted = await documentTagRepository.findOne({ where: { id: documentTagId } })
    expect(deleted).toBeNull()
  })

  it("should return 404 for a non-existent document tag ID", async () => {
    await createContext()
    documentTagId = "00000000-0000-0000-0000-000000000000"

    const response = await subject()

    expectResponse(response, 404)
  })
})
