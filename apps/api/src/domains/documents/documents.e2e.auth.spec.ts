import { DocumentsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import type { Repository } from "typeorm"
import { AUTH_ERRORS } from "@/common/errors/auth-errors"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import type { MulterFile } from "@/common/types"
import { removeNullish } from "@/common/utils/remove-nullish"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { projectFactory } from "@/domains/projects/project.factory"
import { setupUserGuardForTesting } from "../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../test/request"
import { Document } from "./document.entity"
import { createDocumentForProject } from "./document.factory"
import { DocumentsModule } from "./documents.module"

describe("DocumentsController (e2e)", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >
  let documentRepository: Repository<Document>

  // Variables for the tests
  let organizationId: string | null = "random-organization-id"
  let projectId: string | null = "random-project-id"
  let accessToken: string | null = "token"
  let auth0Id = "auth0|123"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [DocumentsModule],
      applyOverrides: (moduleBuilder) => setupUserGuardForTesting(moduleBuilder, () => auth0Id),
    })
    repositories = setup.getAllRepositories()
    documentRepository = setup.getRepository(Document)
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    organizationId = "random-organization-id"
    projectId = "random-project-id"
    accessToken = "token"
    auth0Id = "auth0|123"
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    app.close()
  })

  const createContextForRole = async (role: "owner" | "admin" | "member" = "owner") => {
    const { user, organization, project } = await createOrganizationWithProject(repositories, {
      membership: { role },
    })
    organizationId = organization.id
    projectId = project.id
    accessToken = "token"
    auth0Id = user.auth0Id
    return { organization, project }
  }

  describe("DocumentsRoutes.uploadOne", () => {
    const subject = async (payload?: typeof DocumentsRoutes.uploadOne.request) =>
      request({
        route: DocumentsRoutes.uploadOne,
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
      projectId = null // reset to a non-null value
      expectResponse(await subject(), 500, "Internal server error")
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("doesn't allow a simple member to upload a document", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
    it("allows the owner to upload a document", async () => {
      await createContextForRole("owner")
      expectResponse(
        await subject({
          payload: {
            file: new File(["file content"], "test.txt", {
              type: "text/plain",
            }) as unknown as MulterFile,
          },
        }),
        422,
      )
    })
  })

  describe("DocumentsRoutes.getAll", () => {
    const subject = async (payload?: typeof DocumentsRoutes.getAll.request) =>
      request({
        route: DocumentsRoutes.getAll,
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
      projectId = null // reset to a non-null value
      expectResponse(await subject(), 500, "Internal server error")
    })
    it("requires the user to be a member of the organization", async () => {
      await createContextForRole("owner")
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database
      expectResponse(await subject(), 401, AUTH_ERRORS.NOT_MEMBER_OF_ORG)
    })
    it("doesn't allow a simple member to get all documents", async () => {
      await createContextForRole("member")
      expectResponse(await subject(), 403, AUTH_ERRORS.UNAUTHORIZED_RESOURCE)
    })
    it("allows the owner to get all documents", async () => {
      await createContextForRole("owner")
      expectResponse(await subject(), 200)
    })
  })

  describe("DocumentsRoutes.deleteOne", () => {
    const subject = async (params: {
      organizationId: string | null
      projectId: string | null
      documentId: string | null
    }) =>
      request({
        route: DocumentsRoutes.deleteOne,
        pathParams: removeNullish(params),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(
        await subject({
          organizationId: "random-organization-id",
          projectId: "random-project-id",
          documentId: "random-document-id",
        }),
        401,
        AUTH_ERRORS.NO_ACCESS_TOKEN,
      )
    })
    it("requires a valid organization ID", async () => {
      expectResponse(
        await subject({
          organizationId: null,
          projectId: "random-project-id",
          documentId: "random-document-id",
        }),
        400,
        AUTH_ERRORS.NO_ORGANIZATION_ID,
      )
    })
    it("requires a valid project ID", async () => {
      expectResponse(
        await subject({
          organizationId: "random-organization-id",
          projectId: null,
          documentId: "random-document-id",
        }),
        500,
        "Internal server error",
      )
    })
    it("requires the user to be a member of the organization", async () => {
      const { organization, project } = await createContextForRole("owner")
      const document = await createDocumentForProject({
        repositories: { documentRepository },
        project,
      })
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database
      expectResponse(
        await subject({
          organizationId: organization.id,
          projectId: project.id,
          documentId: document.id,
        }),
        401,
        AUTH_ERRORS.NOT_MEMBER_OF_ORG,
      )
    })
    it("requires the document to be part of the project", async () => {
      const { organization, project: project1 } = await createContextForRole("owner")
      const project2 = await repositories.projectRepository.save(
        projectFactory.transient({ organization }).build(),
      )
      const document = await createDocumentForProject({
        repositories: { documentRepository },
        project: project2,
      })
      expect(document.projectId).toBe(project2.id)
      expectResponse(
        await subject({
          organizationId: organization.id,
          projectId: project1.id,
          documentId: document.id,
        }),
        403,
        AUTH_ERRORS.UNAUTHORIZED_RESOURCE,
      )
    })
    it("doesn't allow a simple member to delete a document", async () => {
      const { organization, project } = await createContextForRole("member")
      const document = await createDocumentForProject({
        repositories: { documentRepository },
        project,
      })
      expectResponse(
        await subject({
          organizationId: organization.id,
          projectId: project.id,
          documentId: document.id,
        }),
        403,
        AUTH_ERRORS.UNAUTHORIZED_RESOURCE,
      )
    })
    it("allows the owner to delete a document", async () => {
      const { organization, project } = await createContextForRole("owner")
      const document = await createDocumentForProject({
        repositories: { documentRepository },
        project,
      })
      expectResponse(
        await subject({
          organizationId: organization.id,
          projectId: project.id,
          documentId: document.id,
        }),
        200,
      )
    })
  })

  describe("DocumentsRoutes.getTemporaryUrl", () => {
    const subject = async (params: {
      organizationId: string | null
      projectId: string | null
      documentId: string | null
    }) =>
      request({
        route: DocumentsRoutes.getTemporaryUrl,
        pathParams: removeNullish(params),
        token: accessToken ?? undefined,
      })

    it("requires an authentication token", async () => {
      accessToken = null
      expectResponse(
        await subject({
          organizationId: "random-organization-id",
          projectId: "random-project-id",
          documentId: "random-document-id",
        }),
        401,
        AUTH_ERRORS.NO_ACCESS_TOKEN,
      )
    })
    it("requires a valid organization ID", async () => {
      expectResponse(
        await subject({
          organizationId: null,
          projectId: "random-project-id",
          documentId: "random-document-id",
        }),
        400,
        AUTH_ERRORS.NO_ORGANIZATION_ID,
      )
    })
    it("requires a valid project ID", async () => {
      expectResponse(
        await subject({
          organizationId: "random-organization-id",
          projectId: null,
          documentId: "random-document-id",
        }),
        500,
        "Internal server error",
      )
    })
    it("requires the user to be a member of the organization", async () => {
      const { organization, project } = await createContextForRole("owner")
      const document = await createDocumentForProject({
        repositories: { documentRepository },
        project,
      })
      auth0Id = "another-auth0-id" // this will trigger a new user to be created in the database
      expectResponse(
        await subject({
          organizationId: organization.id,
          projectId: project.id,
          documentId: document.id,
        }),
        401,
        AUTH_ERRORS.NOT_MEMBER_OF_ORG,
      )
    })
    it("requires the document to be part of the project", async () => {
      const { organization, project: project1 } = await createContextForRole("owner")
      const project2 = await repositories.projectRepository.save(
        projectFactory.transient({ organization }).build(),
      )
      const document = await createDocumentForProject({
        repositories: { documentRepository },
        project: project2,
      })
      expect(document.projectId).toBe(project2.id)
      expectResponse(
        await subject({
          organizationId: organization.id,
          projectId: project1.id,
          documentId: document.id,
        }),
        403,
        AUTH_ERRORS.UNAUTHORIZED_RESOURCE,
      )
    })
    it("doesn't allow a simple member to delete a document", async () => {
      const { organization, project } = await createContextForRole("member")
      const document = await createDocumentForProject({
        repositories: { documentRepository },
        project,
      })
      expectResponse(
        await subject({
          organizationId: organization.id,
          projectId: project.id,
          documentId: document.id,
        }),
        403,
        AUTH_ERRORS.UNAUTHORIZED_RESOURCE,
      )
    })
    it("allows the owner to delete a document", async () => {
      const { organization, project } = await createContextForRole("owner")
      const document = await createDocumentForProject({
        repositories: { documentRepository },
        project,
      })
      expectResponse(
        await subject({
          organizationId: organization.id,
          projectId: project.id,
          documentId: document.id,
        }),
        201,
      )
    })
  })
})
