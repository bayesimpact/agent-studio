import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { Repository } from "typeorm"
import type { Agent } from "@/domains/agents/agent.entity"
import { agentFactory } from "@/domains/agents/agent.factory"
import type { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import { conversationAgentSessionFactory } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.factory"
import type { Document } from "@/domains/documents/document.entity"
import { documentFactory } from "@/domains/documents/document.factory"
import type { Project } from "@/domains/projects/project.entity"
import { projectFactory } from "@/domains/projects/project.factory"
import type { User } from "@/domains/users/user.entity"
import { userFactory } from "@/domains/users/user.factory"
import type { AgentMessage } from "../agents/shared/agent-session-messages/agent-message.entity"
import { agentMessageFactory } from "../agents/shared/agent-session-messages/agent-messages.factory"
import type { UserMembership } from "./memberships/organization-membership.entity"
import { userMembershipFactory } from "./memberships/organization-membership.factory"
import type { Organization } from "./organization.entity"

export const organizationFactory = Factory.define<Organization>(({ sequence, params }) => {
  const now = new Date()
  return {
    id: params.id || randomUUID(),
    name: params.name || `Test Organization ${sequence}`,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    deletedAt: null,
    memberships: params.memberships || [],
    projects: params.projects || [],
    conversationAgentSessions: params.conversationAgentSessions || [],
    agentMessageFeedbacks: params.agentMessageFeedbacks || [],
    featureFlags: params.featureFlags || [],
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

  const agent = agentFactory.transient({ project, organization }).build(params.agent)
  await repositories.agentRepository.save(agent)

  return {
    organization,
    user,
    membership,
    project,
    agent,
  }
}

type CreateOrganizationWithAgentSessionParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  membership?: Partial<UserMembership>
  project?: Partial<Project>
  agent?: Partial<Agent>
  agentSession?: Partial<ConversationAgentSession>
}

type CreateOrganizationWithAgentSessionRepositories = {
  organizationRepository: Repository<Organization>
  userRepository: Repository<User>
  membershipRepository: Repository<UserMembership>
  projectRepository: Repository<Project>
  agentRepository: Repository<Agent>
  conversationAgentSessionRepository: Repository<ConversationAgentSession>
}

export async function createOrganizationWithAgentSession(
  repositories: CreateOrganizationWithAgentSessionRepositories,
  params: CreateOrganizationWithAgentSessionParams = {},
): Promise<{
  organization: Organization
  user: User
  membership: UserMembership
  project: Project
  agent: Agent
  agentSession: ConversationAgentSession
}> {
  const { organization, user, membership, project, agent } = await createOrganizationWithAgent(
    repositories,
    {
      organization: params.organization,
      user: params.user,
      membership: params.membership,
      project: params.project,
      agent: params.agent,
    },
  )

  const agentSession = conversationAgentSessionFactory
    .transient({ organization, project, user, agent })
    .build(params.agentSession)
  await repositories.conversationAgentSessionRepository.save(agentSession)

  return {
    organization,
    user,
    membership,
    project,
    agent,
    agentSession,
  }
}

type CreateOrganizationWithAgentMessageParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  membership?: Partial<UserMembership>
  project?: Partial<Project>
  agent?: Partial<Agent>
  agentSession?: Partial<ConversationAgentSession>
  agentMessage?: Partial<AgentMessage>
}

type CreateOrganizationWithAgentMessageRepositories = {
  organizationRepository: Repository<Organization>
  userRepository: Repository<User>
  membershipRepository: Repository<UserMembership>
  projectRepository: Repository<Project>
  agentRepository: Repository<Agent>
  conversationAgentSessionRepository: Repository<ConversationAgentSession>
  agentMessageRepository: Repository<AgentMessage>
}

export async function createOrganizationWithAgentMessage(
  repositories: CreateOrganizationWithAgentMessageRepositories,
  params: CreateOrganizationWithAgentMessageParams = {},
): Promise<{
  organization: Organization
  user: User
  membership: UserMembership
  project: Project
  agent: Agent
  agentSession: ConversationAgentSession
  agentMessage: AgentMessage
}> {
  const { organization, user, membership, project, agent, agentSession } =
    await createOrganizationWithAgentSession(repositories, {
      organization: params.organization,
      user: params.user,
      membership: params.membership,
      project: params.project,
      agent: params.agent,
      agentSession: params.agentSession,
    })

  const agentMessage = agentMessageFactory
    .transient({ organization, project, session: agentSession })
    .build(params.agentMessage)
  await repositories.agentMessageRepository.save(agentMessage)

  return {
    organization,
    user,
    membership,
    project,
    agent,
    agentSession,
    agentMessage,
  }
}

// ====== DOCUMENT ========

type CreateOrganizationWithDocumentParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  project?: Partial<Project>
  document?: Partial<Document>
  membership?: Partial<UserMembership>
}

type CreateOrganizationWithDocumentRepositories = {
  organizationRepository: Repository<Organization>
  userRepository: Repository<User>
  membershipRepository: Repository<UserMembership>
  projectRepository: Repository<Project>
  documentRepository: Repository<Document>
}

export async function createOrganizationWithDocument(
  repositories: CreateOrganizationWithDocumentRepositories,
  params: CreateOrganizationWithDocumentParams = {},
): Promise<{
  organization: Organization
  user: User
  membership: UserMembership
  document: Document
  project: Project
}> {
  const { organization, user, membership, project } = await createOrganizationWithProject(
    repositories,
    {
      organization: params.organization,
      user: params.user,
      membership: params.membership,
    },
  )

  const document = documentFactory.transient({ organization, project }).build(params.document)
  await repositories.documentRepository.save(document)

  return {
    organization,
    user,
    membership,
    project,
    document,
  }
}
