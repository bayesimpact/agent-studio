import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Repository } from "typeorm"
import type { Agent } from "@/agents/agent.entity"
import { agentFactory } from "@/agents/agent.factory"
import type { ChatSession } from "@/chat-sessions/chat-session.entity"
import { chatSessionFactory } from "@/chat-sessions/chat-session.factory"
import type { Project } from "@/projects/project.entity"
import { projectFactory } from "@/projects/project.factory"
import type { User } from "@/users/user.entity"
import { userFactory } from "@/users/user.factory"
import type { Organization } from "./organization.entity"
import type { UserMembership } from "./user-membership.entity"
import { userMembershipFactory } from "./user-membership.factory"

export const organizationFactory = Factory.define<Organization>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test Organization ${sequence}`,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    memberships: params.memberships || [],
    projects: params.projects || [],
    chatSessions: params.chatSessions || [],
  } satisfies Organization
})

type BuildOrganizationWithOwnerParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  membership?: Partial<UserMembership>
}

export function buildOrganizationWithOwner(params: BuildOrganizationWithOwnerParams = {}): {
  organization: Organization
  user: User
  membership: UserMembership
} {
  const organization = organizationFactory.build(params.organization)
  const user = userFactory.build(params.user)
  const membership = userMembershipFactory
    .owner()
    .transient({ user, organization })
    .build(params.membership)

  return {
    organization,
    user,
    membership,
  }
}

type CreateOrganizationWithOwnerParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  membership?: Partial<UserMembership>
}

type CreateOrganizationWithOwnerRepositories = {
  userRepository: Repository<User>
  organizationRepository: Repository<Organization>
  membershipRepository: Repository<UserMembership>
}

export async function createOrganizationWithOwner(
  repositories: CreateOrganizationWithOwnerRepositories,
  params: CreateOrganizationWithOwnerParams = {},
): Promise<{
  organization: Organization
  user: User
  membership: UserMembership
}> {
  const { organization, user, membership } = buildOrganizationWithOwner(params)

  await repositories.userRepository.save(user)
  await repositories.organizationRepository.save(organization)
  await repositories.membershipRepository.save(membership)

  return {
    organization,
    user,
    membership,
  }
}

type CreateOrganizationWithProjectParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  project?: Partial<Project>
  membership?: Partial<UserMembership>
}

type CreateOrganizationWithProjectRepositories = {
  organizationRepository: Repository<Organization>
  userRepository: Repository<User>
  membershipRepository: Repository<UserMembership>
  projectRepository: Repository<Project>
}

export async function createOrganizationWithProject(
  repositories: CreateOrganizationWithProjectRepositories,
  params: CreateOrganizationWithProjectParams = {},
): Promise<{
  organization: Organization
  user: User
  membership: UserMembership
  project: Project
}> {
  const { organization, user, membership } = await createOrganizationWithOwner(repositories, {
    organization: params.organization,
    user: params.user,
    membership: params.membership,
  })

  const project = projectFactory.transient({ organization }).build(params.project)
  await repositories.projectRepository.save(project)

  return {
    organization,
    user,
    membership,
    project,
  }
}

type CreateOrganizationWithAgentParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  membership?: Partial<UserMembership>
  project?: Partial<Project>
  agent?: Partial<Agent>
}

type CreateOrganizationWithAgentRepositories = {
  organizationRepository: Repository<Organization>
  userRepository: Repository<User>
  membershipRepository: Repository<UserMembership>
  projectRepository: Repository<Project>
  agentRepository: Repository<Agent>
}

export async function createOrganizationWithAgent(
  repositories: CreateOrganizationWithAgentRepositories,
  params: CreateOrganizationWithAgentParams = {},
): Promise<{
  organization: Organization
  user: User
  membership: UserMembership
  project: Project
  agent: Agent
}> {
  const { organization, user, membership, project } = await createOrganizationWithProject(
    repositories,
    {
      organization: params.organization,
      user: params.user,
      project: params.project,
      membership: params.membership,
    },
  )

  const agent = agentFactory.transient({ project }).build(params.agent)
  await repositories.agentRepository.save(agent)

  return {
    organization,
    user,
    membership,
    project,
    agent,
  }
}

type CreateOrganizationWithChatSessionParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  project?: Partial<Project>
  agent?: Partial<Agent>
  chatSession?: Partial<ChatSession>
}

type CreateOrganizationWithChatSessionRepositories = {
  organizationRepository: Repository<Organization>
  userRepository: Repository<User>
  membershipRepository: Repository<UserMembership>
  projectRepository: Repository<Project>
  agentRepository: Repository<Agent>
  chatSessionRepository: Repository<ChatSession>
}

export async function createOrganizationWithChatSession(
  repositories: CreateOrganizationWithChatSessionRepositories,
  params: CreateOrganizationWithChatSessionParams = {},
): Promise<{
  organization: Organization
  user: User
  membership: UserMembership
  project: Project
  agent: Agent
  chatSession: ChatSession
}> {
  const { organization, user, membership, project, agent } = await createOrganizationWithAgent(
    repositories,
    {
      organization: params.organization,
      user: params.user,
      project: params.project,
      agent: params.agent,
    },
  )

  const chatSession = chatSessionFactory
    .transient({ organization, user, agent })
    .build(params.chatSession)
  await repositories.chatSessionRepository.save(chatSession)

  return {
    organization,
    user,
    membership,
    project,
    agent,
    chatSession,
  }
}
