import { randomUUID } from "node:crypto"
import { DocumentTagsRoutes } from "@caseai-connect/api-contracts"
import { afterAll } from "@jest/globals"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { projectFactory } from "@/domains/projects/project.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { DocumentTag } from "../document-tag.entity"
import { documentTagFactory } from "../document-tag.factory"
import { DocumentTagsModule } from "../document-tags.module"

describe("DocumentTags - Auth", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let organizationId: string | null = "random-organization-id"
  let projectId: string | null = "random-project-id"
  let documentTagId: string | null = "random-document-tag-id"
  let accessToken: string | null = "token"
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
    organizationId = "random-organization-id"
    projectId = "random-project-id"
    documentTagId = "random-document-tag-id"
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await app.close()
  })

  const createContextForRole = async (role: "owner" | "admin" | "member" = "owner") => {
    const { user, organization, project } = await createOrganizationWithProject(repositories, {
      membership: { role },
    })
    organizationId = organization.id
    projectId = project.id
    const documentTag = documentTagFactory.transient({ organization, project }).build()
    await setup.getRepository(DocumentTag).save(documentTag)
    documentTagId = documentTag.id
    accessToken = "token"
    auth0Id = user.auth0Id
    return { organization, project }
  }

  describe("DocumentTagsRoutes.getAll", () => {
    const subject = async () =>
      request({
        route: DocumentTagsRoutes.getAll,
        pathParams: removeNullish({ organizationId, projectId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid project ID", async () => {
      await createContextForRole("owner")
      projectId = null
      expectResponse(await subject(), 404)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("doesn't allow a simple member to get all document tags", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("DocumentTagsRoutes.createOne", () => {
    const subject = async (payload?: typeof DocumentTagsRoutes.createOne.request) =>
      request({
        route: DocumentTagsRoutes.createOne,
        pathParams: removeNullish({ organizationId, projectId }),
        token: accessToken ?? undefined,
        request: payload,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid project ID", async () => {
      await createContextForRole("owner")
      projectId = null
      expectResponse(await subject(), 404)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("doesn't allow a simple member to create a document tag", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("DocumentTagsRoutes.updateOne", () => {
    const subject = async () =>
      request({
        route: DocumentTagsRoutes.updateOne,
        pathParams: removeNullish({ organizationId, projectId, documentTagId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid project ID", async () => {
      await createContextForRole("owner")
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires the document tag to be part of the project", async () => {
      const { organization } = await createContextForRole("owner")
      const project2 = await repositories.projectRepository.save(
        projectFactory.transient({ organization }).build(),
      )
      projectId = project2.id
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to update a document tag", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })

  describe("DocumentTagsRoutes.deleteOne", () => {
    const subject = async () =>
      request({
        route: DocumentTagsRoutes.deleteOne,
        pathParams: removeNullish({ organizationId, projectId, documentTagId }),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(await subject(), 401, AUTH_ERRORS.NO_ACCESS_TOKEN)
    })
    it("requires a valid organization ID", async () => {
      organizationId = null
      expectResponse(await subject(), 400, AUTH_ERRORS.NO_ORGANIZATION_ID)
    })
    it("requires a valid project ID", async () => {
      await createContextForRole("owner")
      projectId = randomUUID()
      expectResponse(await subject(), 404)
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id"
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("requires the document tag to be part of the project", async () => {
      const { organization } = await createContextForRole("owner")
      const project2 = await repositories.projectRepository.save(
        projectFactory.transient({ organization }).build(),
      )
      projectId = project2.id
      expectResponse(await subject(), 404)
    })
    it("doesn't allow a simple member to delete a document tag", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
  })
})
