import { randomUUID } from "node:crypto"
import { Factory } from "fishery"
import type { AllRepositories } from "@/common/test/test-transaction-manager"
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
import type { OrganizationMembership } from "./memberships/organization-membership.entity"
import { organizationMembershipFactory } from "./memberships/organization-membership.factory"
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

type BaseParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  organizationMembership?: Partial<OrganizationMembership>
}

export function buildOrganizationWithOwner(params: BaseParams = {}): {
  organization: Organization
  user: User
  organizationMembership: OrganizationMembership
} {
  const organization = organizationFactory.build(params.organization)
  const user = userFactory.build(params.user)
  const organizationMembership = organizationMembershipFactory
    .owner()
    .transient({ user, organization })
    .build(params.organizationMembership)

  return { organization, user, organizationMembership }
}

export async function createOrganizationWithOwner(
  repositories: AllRepositories,
  params: BaseParams = {},
): Promise<{
  organization: Organization
  user: User
  organizationMembership: OrganizationMembership
}> {
  const { organization, user, organizationMembership } = buildOrganizationWithOwner(params)

  await Promise.all([
    repositories.userRepository.save(user),
    repositories.organizationRepository.save(organization),
  ])
  await repositories.organizationMembershipRepository.save(organizationMembership)

  return { organization, user, organizationMembership }
}

export async function createOrganizationWithProject(
  repositories: AllRepositories,
  params: BaseParams & { project?: Partial<Project> } = {},
): Promise<{
  organization: Organization
  user: User
  organizationMembership: OrganizationMembership
  project: Project
}> {
  const { organization, user, organizationMembership } = await createOrganizationWithOwner(
    repositories,
    params,
  )

  const project = projectFactory.transient({ organization }).build(params.project)
  await repositories.projectRepository.save(project)

  return { organization, user, organizationMembership, project }
}

export async function createOrganizationWithAgent(
  repositories: AllRepositories,
  params: BaseParams & { project?: Partial<Project>; agent?: Partial<Agent> } = {},
): Promise<{
  organization: Organization
  user: User
  organizationMembership: OrganizationMembership
  project: Project
  agent: Agent
}> {
  const { organization, user, organizationMembership, project } =
    await createOrganizationWithProject(repositories, params)

  const agent = agentFactory.transient({ project, organization }).build(params.agent)
  await repositories.agentRepository.save(agent)

  return { organization, user, organizationMembership, project, agent }
}

export async function createOrganizationWithAgentSession(
  repositories: AllRepositories,
  params: BaseParams & {
    project?: Partial<Project>
    agent?: Partial<Agent>
    agentSession?: Partial<ConversationAgentSession>
  } = {},
): Promise<{
  organization: Organization
  user: User
  organizationMembership: OrganizationMembership
  project: Project
  agent: Agent
  agentSession: ConversationAgentSession
}> {
  const { organization, user, organizationMembership, project, agent } =
    await createOrganizationWithAgent(repositories, params)

  const agentSession = conversationAgentSessionFactory
    .transient({ organization, project, user, agent })
    .build(params.agentSession)
  await repositories.conversationAgentSessionRepository.save(agentSession)

  return { organization, user, organizationMembership, project, agent, agentSession }
}

export async function createOrganizationWithAgentMessage(
  repositories: AllRepositories,
  params: BaseParams & {
    project?: Partial<Project>
    agent?: Partial<Agent>
    agentSession?: Partial<ConversationAgentSession>
    agentMessage?: Partial<AgentMessage>
  } = {},
): Promise<{
  organization: Organization
  user: User
  organizationMembership: OrganizationMembership
  project: Project
  agent: Agent
  agentSession: ConversationAgentSession
  agentMessage: AgentMessage
}> {
  const { organization, user, organizationMembership, project, agent, agentSession } =
    await createOrganizationWithAgentSession(repositories, params)

  const agentMessage = agentMessageFactory
    .transient({ organization, project, session: agentSession })
    .build(params.agentMessage)
  await repositories.agentMessageRepository.save(agentMessage)

  return { organization, user, organizationMembership, project, agent, agentSession, agentMessage }
}

export async function createOrganizationWithDocument(
  repositories: AllRepositories,
  params: BaseParams & { project?: Partial<Project>; document?: Partial<Document> } = {},
): Promise<{
  organization: Organization
  user: User
  organizationMembership: OrganizationMembership
  project: Project
  document: Document
}> {
  const { organization, user, organizationMembership, project } =
    await createOrganizationWithProject(repositories, params)

  const document = documentFactory.transient({ organization, project }).build(params.document)
  await repositories.documentRepository.save(document)

  return { organization, user, organizationMembership, project, document }
}
