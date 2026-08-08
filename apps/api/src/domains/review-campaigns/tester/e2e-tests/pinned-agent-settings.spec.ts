import { randomUUID } from "node:crypto"
import { ReviewCampaignsRoutes } from "@caseai-connect/api-contracts"
import type { INestApplication } from "@nestjs/common"
import type { App } from "supertest/types"
import {
  type AllRepositories,
  clearTestDatabase,
  setupE2eTestDatabase,
  teardownE2eTestDatabase,
} from "@/common/test/test-database"
import { removeNullish } from "@/common/utils/remove-nullish"
import { agentSettingsFactory } from "@/domains/agents/settings/agent.settings.factory"
import { INVITATION_SENDER } from "@/domains/auth/invitation-sender.interface"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import {
  reviewCampaignMembershipFactory,
  saveReviewCampaignMembership,
} from "../../memberships/review-campaign-membership.factory"
import { reviewCampaignFactory } from "../../review-campaign.factory"
import { ReviewCampaignsModule } from "../../review-campaigns.module"

const mockInvitationSender = {
  sendInvitation: jest.fn().mockResolvedValue({ ticketId: "ticket-pinned" }),
}

describe("ReviewCampaigns - pinned agent settings", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string = randomUUID()
  let projectId: string = randomUUID()
  let reviewCampaignId: string = randomUUID()
  let accessToken: string = "token"
  let auth0Id = `auth0|${randomUUID()}`

  beforeAll(async () => {
    setup = await setupE2eTestDatabase({
      additionalImports: [ReviewCampaignsModule],
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
    await app.close()
  })

  /**
   * An active campaign pinned to revision 1, with revision 2 published afterwards.
   * Both revisions carry a distinct greeting so we can tell which one was used.
   */
  const seedCampaignPinnedToOldRevision = async () => {
    const { organization, project, user, agent, agentSettings } = await createOrganizationWithAgent(
      repositories,
      {
        user: { auth0Id },
        agent: { type: "conversation" },
        agentSettings: { greetingMessage: "Greeting from version 1" },
      },
    )
    const newerSettings = agentSettingsFactory
      .transient({ organization, project, agent })
      .build({ revision: 2, greetingMessage: "Greeting from version 2" })
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
    reviewCampaignId = campaign.id

    return { agent, agentSettings, newerSettings, campaign }
  }

  it("serves the pinned revision's greeting in the tester context", async () => {
    await seedCampaignPinnedToOldRevision()

    const response = await request({
      route: ReviewCampaignsRoutes.getTesterContext,
      pathParams: removeNullish({ organizationId, projectId, reviewCampaignId }),
      token: accessToken,
    })
    expectResponse(response, 200)
    expect(response.body.data.agent.greetingMessage).toBe("Greeting from version 1")
  })

  it("starts tester sessions on the pinned revision", async () => {
    const { agentSettings } = await seedCampaignPinnedToOldRevision()

    const response = await request({
      route: ReviewCampaignsRoutes.startTesterSession,
      pathParams: removeNullish({ organizationId, projectId, reviewCampaignId }),
      token: accessToken,
      request: { payload: { type: "live" } },
    })
    expectResponse(response, 201)

    // Sessions carry no settings id; the greeting message they open with does.
    const greeting = await repositories.agentMessageRepository.findOne({
      where: { sessionId: response.body.data.id },
    })
    expect(greeting?.agentSettingsId).toBe(agentSettings.id)
    expect(greeting?.content).toBe("Greeting from version 1")
  })
})
