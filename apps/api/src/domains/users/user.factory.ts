import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Repository } from "typeorm"
import type { User } from "./user.entity"

export const userFactory = Factory.define<User>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    auth0Id: params.auth0Id || `auth0|${sequence}`,
    email: params.email || `user${sequence}@example.com`,
    name: params.name ?? `Test User ${sequence}`,
    pictureUrl: params.pictureUrl ?? null,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    deletedAt: null,
    memberships: params.memberships || [],
    conversationAgentSessions: params.conversationAgentSessions || [],
    agentMessageFeedbacks: params.agentMessageFeedbacks || [],
    projectMemberships: params.projectMemberships || [],
    agentMemberships: params.agentMemberships || [],
    reviewCampaignMemberships: params.reviewCampaignMemberships || [],
    testerCampaignSurveys: params.testerCampaignSurveys || [],
  } satisfies User
})

export const createSingleUser = async (
  repository: Repository<User>,
  userParams: Partial<User> = {},
): Promise<User> => {
  const user = userFactory.build(userParams)
  await repository.save(user)
  return user
}
