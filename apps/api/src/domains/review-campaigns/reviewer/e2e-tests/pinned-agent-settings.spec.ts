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
import { conversationAgentSessionFactory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.factory"
import { agentSettingsFactory } from "@/domains/agents/settings/agent.settings.factory"
import type { AgentSettings } from "@/domains/agents/settings/agent-settings.entity"
import { INVITATION_SENDER } from "@/domains/auth/invitation-sender.interface"
import { createOrganizationWithAgent } from "@/domains/organizations/organization.factory"
import { userFactory } from "@/domains/users/user.factory"
import { setupUserGuardForTesting } from "../../../../../test/e2e.helpers"
import { expectResponse, type Requester, testRequester } from "../../../../../test/request"
import {
  reviewCampaignMembershipFactory,
  saveReviewCampaignMembership,
} from "../../memberships/review-campaign-membership.factory"
import { reviewCampaignFactory } from "../../review-campaign.factory"
import { ReviewCampaignsModule } from "../../review-campaigns.module"

const mockInvitationSender = {
  sendInvitation: jest.fn().mockResolvedValue({ ticketId: "ticket-reviewer-pinned" }),
}

const PINNED_SCHEMA = {
  type: "object" as const,
  properties: { topic: { type: "string", title: "Topic" } },
}
const NEWER_SCHEMA = {
  type: "object" as const,
  properties: { summary: { type: "string", title: "Summary" } },
}

/**
 * The reviewer grades a session that was collected under the campaign's pinned revision, so
 * the form they fill has to come from that revision — not from whatever the agent's newest
 * settings row happens to be, draft included.
 */
describe("ReviewCampaigns - reviewer form comes from the pinned revision", () => {
  let app: INestApplication<App>
  let request: Requester
  let setup: Awaited<ReturnType<typeof setupE2eTestDatabase>>
  let repositories: AllRepositories

  let organizationId: string = randomUUID()
  let projectId: string = randomUUID()
  let reviewCampaignId: string = randomUUID()
  let sessionId: string = randomUUID()
  let accessToken: string = "token"
  let auth0Id = `auth0|reviewer-pinned-${randomUUID()}`

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
    auth0Id = `auth0|reviewer-pinned-${randomUUID()}`
  })

  afterAll(async () => {
    await teardownE2eTestDatabase(setup)
    await app.close()
  })

  /**
   * A campaign pinned to revision 1, with a differently-configured revision 2 on top of it.
   * The caller is an accepted reviewer on a session another user collected.
   */
  const seedCampaignPinnedToOldRevision = async ({
    pinned,
    newer,
  }: {
    pinned: Partial<AgentSettings>
    newer: Partial<AgentSettings>
  }) => {
    const { organization, project, user, agent, agentSettings } = await createOrganizationWithAgent(
      repositories,
      {
        user: { auth0Id },
        agent: { type: "conversation" },
        agentSettings: pinned,
      },
    )
    await repositories.agentSettingsRepository.save(
      agentSettingsFactory
        .transient({ organization, project, agent })
        .build({ revision: 2, ...newer }),
    )

    const tester = await repositories.userRepository.save(
      userFactory.build({ email: `tester-pinned-${randomUUID()}@example.com` }),
    )
    const campaign = reviewCampaignFactory
      .active()
      .transient({ organization, project, agent, agentSettings })
      .build()
    await repositories.reviewCampaignRepository.save(campaign)
    await saveReviewCampaignMembership({
      repositories,
      membership: reviewCampaignMembershipFactory
        .reviewer()
        .transient({ organization, project, campaign, user })
        .build(),
    })
    const session = conversationAgentSessionFactory
      .transient({ organization, project, agent, user: tester })
      .build({ campaignId: campaign.id, result: { topic: "billing" } })
    await repositories.conversationAgentSessionRepository.save(session)

    organizationId = organization.id
    projectId = project.id
    reviewCampaignId = campaign.id
    sessionId = session.id
  }

  const subject = async () =>
    request({
      route: ReviewCampaignsRoutes.getReviewerSession,
      pathParams: removeNullish({ organizationId, projectId, reviewCampaignId, sessionId }),
      token: accessToken,
    })

  it("serves the pinned revision's form schema, not the newest published one", async () => {
    await seedCampaignPinnedToOldRevision({
      pinned: { fillFormEnabled: true, outputJsonSchema: PINNED_SCHEMA },
      newer: { fillFormEnabled: true, outputJsonSchema: NEWER_SCHEMA },
    })

    const response = await subject()
    expectResponse(response, 200)
    expect(response.body.data.formResult?.schema).toEqual(PINNED_SCHEMA)
    expect(response.body.data.formResult?.value).toEqual({ topic: "billing" })
  })

  it("ignores an unpublished draft revision on top of the pin", async () => {
    await seedCampaignPinnedToOldRevision({
      pinned: { fillFormEnabled: true, outputJsonSchema: PINNED_SCHEMA },
      newer: { fillFormEnabled: true, outputJsonSchema: NEWER_SCHEMA, isDraft: true },
    })

    const response = await subject()
    expectResponse(response, 200)
    expect(response.body.data.formResult?.schema).toEqual(PINNED_SCHEMA)
  })

  it("reports no form when the pinned revision had form filling off", async () => {
    await seedCampaignPinnedToOldRevision({
      pinned: { fillFormEnabled: false, outputJsonSchema: null },
      newer: { fillFormEnabled: true, outputJsonSchema: NEWER_SCHEMA },
    })

    const response = await subject()
    expectResponse(response, 200)
    expect(response.body.data.formResult).toBeNull()
  })
})
