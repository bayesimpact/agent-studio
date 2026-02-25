import { InvitationsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import { clearTestDatabase } from "@/common/test/test-database"
import {
  setupTransactionalTestDatabase,
  teardownTestDatabase,
} from "@/common/test/test-transaction-manager"
import { createOrganizationWithProject } from "@/domains/organizations/organization.factory"
import { mockInvitationSender, setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import { ProjectsModule } from "../../projects.module"
import { createProjectMembership } from "../project-membership.factory"

describe("Invitations - acceptInvitation", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupTransactionalTestDatabase>>
  let repositories: ReturnType<
    Awaited<ReturnType<typeof setupTransactionalTestDatabase>>["getAllRepositories"]
  >

  let _organizationId: string
  let _projectId: string
  let accessToken: string | undefined = "token"
  let auth0Id = "auth0|invitee-user"

  beforeAll(async () => {
    setup = await setupTransactionalTestDatabase({
      additionalImports: [ProjectsModule],
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
    auth0Id = "auth0|invitee-user"
    mockInvitationSender.resetTicketCounter()
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await teardownTestDatabase(setup)
    await app.close()
  })

  const subject = async (payload?: typeof InvitationsRoutes.acceptOne.request) =>
    request({
      route: InvitationsRoutes.acceptOne,
      token: accessToken,
      request: payload,
    })

  const createInvitation = async () => {
    const { user, organization, project } = await createOrganizationWithProject(repositories)
    _organizationId = organization.id
    _projectId = project.id
    auth0Id = user.auth0Id

    const { membership } = await createProjectMembership({
      repositories,
      organization,
      project,
      user: {
        email: "invitee@example.com",
      },
    })
    const ticketId = membership.invitationToken
    return { membership, ticketId, organization, project }
  }

  it("should accept an invitation and return success", async () => {
    const { ticketId } = await createInvitation()

    const response = await subject({ payload: { ticketId } })

    expectResponse(response, 201)
    expect(response.body.data).toEqual({ success: true })
  })

  it("should update the membership status to accepted", async () => {
    const { ticketId, membership } = await createInvitation()

    await subject({ payload: { ticketId } })

    const updatedMembership = await repositories.projectMembershipRepository.findOne({
      where: { id: membership.id },
    })

    expect(updatedMembership).toBeDefined()
    expect(updatedMembership!.status).toBe("accepted")
  })

  it("should create an organization membership for the invitee", async () => {
    const { ticketId, membership, organization } = await createInvitation()

    await subject({ payload: { ticketId } })

    const orgMembership = await repositories.membershipRepository.findOne({
      where: { userId: membership.userId, organizationId: organization.id },
    })

    expect(orgMembership).toBeDefined()
    expect(orgMembership!.role).toBe("member")
  })

  it("should return 404 for an unknown ticketId", async () => {
    const response = await subject({ payload: { ticketId: "non-existent-ticket" } })

    expectResponse(response, 404)
  })

  it("should be idempotent — accepting an already accepted invitation returns success", async () => {
    const { ticketId } = await createInvitation()

    // Accept first time
    const firstResponse = await subject({ payload: { ticketId } })
    expectResponse(firstResponse, 201)

    // Accept again
    const secondResponse = await subject({ payload: { ticketId } })
    expectResponse(secondResponse, 201)
    expect(secondResponse.body.data).toEqual({ success: true })
  })

  it("should return 404 when ticketId does not match any invitation", async () => {
    const response = await subject({ payload: { ticketId: "any-ticket" } })

    expectResponse(response, 404)
  })
})
