import { afterAll } from "@jest/globals"
import type { RequiredConnectScope } from "@/common/entities/connect-required-fields"
import { userMembershipFactory } from "@/domains/organizations/memberships/organization-membership.factory"
import { sdk } from "@/external/llm/open-telemetry-init"
import { agentSessionControllerTestSetup } from "./test-setup"

const getTestContext = agentSessionControllerTestSetup()

describe("createSession", () => {
  afterAll(async () => {
    await sdk.shutdown()
  })
  it("should create a live session", async () => {
    const { service, testAgent, testUser, testOrganization, membershipRepository, testProject } =
      getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const membership = userMembershipFactory
      .transient({ user: testUser, organization: testOrganization })
      .member()
      .build()
    await membershipRepository.save(membership)

    const session = await service.createSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
      type: "live",
    })

    expect(session).toBeDefined()
    expect(session.type).toBe("live")
    expect(session.agentId).toBe(testAgent.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
  it("should create a playground session", async () => {
    const { service, testAgent, testUser, testOrganization, membershipRepository, testProject } =
      getTestContext()
    const connectScope: RequiredConnectScope = {
      organizationId: testOrganization.id,
      projectId: testProject.id,
    }

    const membership = userMembershipFactory
      .transient({ user: testUser, organization: testOrganization })
      .member()
      .build()
    await membershipRepository.save(membership)

    const session = await service.createSession({
      connectScope,
      agentId: testAgent.id,
      userId: testUser.id,
      type: "playground",
    })

    expect(session).toBeDefined()
    expect(session.type).toBe("playground")
    expect(session.agentId).toBe(testAgent.id)
    expect(session.userId).toBe(testUser.id)
    expect(session.organizationId).toBe(testOrganization.id)
    expect(session.messages).toBeUndefined()
    expect(session.expiresAt).toBeNull()
  })
})
