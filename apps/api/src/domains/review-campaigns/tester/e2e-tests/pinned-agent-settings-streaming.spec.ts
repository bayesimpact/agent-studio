import { randomUUID } from "node:crypto"
import { AgentSessionMessagesRoutes, ReviewCampaignsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import supertest from "supertest"
import type { App } from "supertest/types"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { removeNullish } from "@/common/utils/remove-nullish"
import { agentSettingsFactory } from "@/domains/agents/settings/agent.settings.factory"
import { StreamingModule } from "@/domains/agents/shared/agent-session-messages/streaming/streaming.module"
import { INVITATION_SENDER } from "@/domains/auth/invitation-sender.interface"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import {
  reviewCampaignMembershipFactory,
  saveReviewCampaignMembership,
} from "../../memberships/review-campaign-membership.factory"
import { reviewCampaignFactory } from "../../review-campaign.factory"
import { ReviewCampaignsModule } from "../../review-campaigns.module"

const mockInvitationSender = {
  sendInvitation: jest.fn().mockResolvedValue({ ticketId: "ticket-pinned-streaming" }),
}

/**
 * Replies are generated through the shared streaming endpoint, not through anything
 * campaign-specific, so this is where a campaign's pin has to hold: the settings the
 * assistant message is stamped with are the settings that produced it.
 */
describe("ReviewCampaigns - pinned agent settings during streaming", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string = randomUUID()
  let projectId: string = randomUUID()
  let agentId: string = randomUUID()
  let reviewCampaignId: string = randomUUID()
  let accessToken: string = "token"
  let auth0Id = `auth0|${randomUUID()}`

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [ReviewCampaignsModule, StreamingModule],
      applyOverrides: (moduleBuilder) =>
        setupUserGuardForTesting(moduleBuilder, () => auth0Id)
          .overrideProvider(INVITATION_SENDER)
          .useValue(mockInvitationSender),
    })
    repositories = setup.getAllRepositories()
    app = setup.module.createNestApplication()
    await app.init()
    request = testRequester(app)
  })

  beforeEach(async () => {
    await clearTestDatabase(setup.dataSource)
    accessToken = "token"
    auth0Id = `auth0|${randomUUID()}`
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await sdk.shutdown()
    await app.close()
  })

  /**
   * An active campaign pinned to revision 1, with a differently-configured revision 2
   * published afterwards. Neither revision has a greeting, so the only assistant message a
   * session ends up with is the streamed reply.
   */
  const seedCampaignPinnedToOldRevision = async () => {
    const { organization, project, user, agent, agentSettings } = await createOrganizationWithAgent(
      repositories,
      {
        user: { auth0Id },
        agent: { type: "conversation" },
        agentSettings: { instructions: "Instructions from version 1" },
      },
    )
    const newerSettings = agentSettingsFactory
      .transient({ organization, project, agent })
      .build({ revision: 2, instructions: "Instructions from version 2" })
    await repositories.agentSettingsRepository.save(newerSettings)

    const campaign = reviewCampaignFactory
      .active()
      .transient({ organization, project, agent, agentSettings })
      .build()
    await repositories.reviewCampaignRepository.save(campaign)
    await saveReviewCampaignMembership({
      repositories,
      membership: reviewCampaignMembershipFactory
        .tester()
        .transient({ organization, project, campaign, user })
        .build(),
    })

    organizationId = organization.id
    projectId = project.id
    agentId = agent.id
    reviewCampaignId = campaign.id

    return { organization, project, user, agent, agentSettings, newerSettings, campaign }
  }

  const startTesterSession = async (): Promise<string> => {
    const response = await request({
      route: ReviewCampaignsRoutes.startTesterSession,
      pathParams: removeNullish({ organizationId, projectId, reviewCampaignId }),
      token: accessToken,
      request: { payload: { type: "live" } },
    })
    expectResponse(response, 201)
    return response.body.data.id
  }

  const stream = (agentSessionId: string, content: string) =>
    supertest(app.getHttpServer())
      .get(
        AgentSessionMessagesRoutes.stream.getPath({
          organizationId,
          projectId,
          agentId,
          agentSessionId,
        }),
      )
      .query({ q: JSON.stringify({ payload: { content } }) })
      .set("Connection", "close")
      .set("Authorization", `Bearer ${accessToken}`)

  const findAssistantReply = async (sessionId: string) =>
    repositories.agentMessageRepository.findOne({
      where: { sessionId, role: "assistant" },
      order: { createdAt: "DESC" },
    })

  it("generates the reply with the campaign's pinned revision, not the newest one", async () => {
    const { agentSettings, newerSettings } = await seedCampaignPinnedToOldRevision()
    const agentSessionId = await startTesterSession()

    const response = await stream(agentSessionId, "Hello")
    expect(response.status).toBe(200)
    expect(response.text).not.toContain("event: error")

    const reply = await findAssistantReply(agentSessionId)
    expect(reply?.agentSettingsId).toBe(agentSettings.id)
    expect(reply?.agentSettingsId).not.toBe(newerSettings.id)
  })

  it("fails loudly instead of falling back when the pin is unreachable in scope", async () => {
    const { campaign } = await seedCampaignPinnedToOldRevision()
    const agentSessionId = await startTesterSession()

    // Re-pin to a settings row that lives in another project. Nothing may resolve settings
    // from outside the campaign's own scope, and a silent fallback to the newest revision is
    // exactly the mixed-configuration bug this resolution exists to prevent.
    const otherTenant = await createOrganizationWithAgent(repositories, {
      user: { auth0Id: `auth0|${randomUUID()}` },
      agent: { type: "conversation" },
    })
    await repositories.reviewCampaignRepository.update(campaign.id, {
      agentSettingsId: otherTenant.agentSettings.id,
    })

    const response = await stream(agentSessionId, "Hello")
    expect(response.text).toContain("event: error")

    // Resolution fails before anything is persisted, so no reply is produced at all.
    expect(await findAssistantReply(agentSessionId)).toBeNull()
  })

  it("keeps using the newest published revision for sessions outside a campaign", async () => {
    const { organization, project, user, agent, newerSettings } =
      await seedCampaignPinnedToOldRevision()
    const session = await repositories.conversationAgentSessionRepository.save({
      organizationId: organization.id,
      projectId: project.id,
      agentId: agent.id,
      userId: user.id,
      type: "live",
      traceId: randomUUID(),
      campaignId: null,
    })

    const response = await stream(session.id, "Hello")
    expect(response.status).toBe(200)
    expect(response.text).not.toContain("event: error")

    const reply = await findAssistantReply(session.id)
    expect(reply?.agentSettingsId).toBe(newerSettings.id)
  })
})
