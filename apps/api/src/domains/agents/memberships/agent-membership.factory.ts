import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { AllRepositories } from "@/common/test/test-transaction-manager"
import type { Organization } from "@/domains/organizations/organization.entity"
import { inviteUserToProject } from "@/domains/projects/memberships/project-membership.factory"
import type { Project } from "@/domains/projects/project.entity"
import type { User } from "@/domains/users/user.entity"
import { userFactory } from "@/domains/users/user.factory"
import type { Agent } from "../agent.entity"
import type {
  AgentMembership,
  AgentMembershipRole,
  AgentMembershipStatus,
} from "./agent-membership.entity"
import { PLACEHOLDER_AUTH0_ID_PREFIX } from "./agent-memberships.service"

type AgentMembershipTransientParams = {
  agent: Agent
  user: User
}

class AgentMembershipFactory extends Factory<AgentMembership, AgentMembershipTransientParams> {
  member() {
    return this.params({ role: "member" })
  }

  admin() {
    return this.params({ role: "admin" })
  }

  owner() {
    return this.params({ role: "owner" })
  }
}

export const agentMembershipFactory = AgentMembershipFactory.define(
  ({ params, transientParams }) => {
    if (!transientParams.agent) {
      throw new Error("agent transient is required")
    }
    if (!transientParams.user) {
      throw new Error("user transient is required")
    }

    const now = new Date()
    return {
      id: params.id || randomUUID(),
      agentId: transientParams.agent.id,
      userId: transientParams.user.id,
      invitationToken: params.invitationToken || randomUUID(),
      status: (params.status || "sent") as AgentMembershipStatus,
      role: (params.role || "member") as AgentMembershipRole,
      createdAt: params.createdAt || now,
      updatedAt: params.updatedAt || now,
      deletedAt: params.deletedAt || null,
      agent: transientParams.agent,
      user: transientParams.user,
    } satisfies AgentMembership
  },
)

export const createAgentMembership = async ({
  repositories,
  organization,
  project,
  agent,
  user,
  role,
}: {
  repositories: AllRepositories
  organization?: Organization
  project: Project
  agent: Agent
  user?: Partial<User>
  role?: AgentMembershipRole
}) => {
  await inviteUserToProject({ repositories, organization, project, user, role })
  const builtUser = userFactory.build(
    user ?? {
      email: "invited@example.com",
      name: "Invited User",
      auth0Id: `${PLACEHOLDER_AUTH0_ID_PREFIX}-test`,
    },
  )
  await repositories.userRepository.save(builtUser)

  const membership = agentMembershipFactory
    .transient({ agent, user: builtUser })
    .build({ role: role || "member" })
  await repositories.agentMembershipRepository.save(membership)

  return { membership, invitedUser: builtUser }
}
