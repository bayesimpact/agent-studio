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
import type { AgentMembership } from "../agents/memberships/agent-membership.entity"
import { agentMembershipFactory } from "../agents/memberships/agent-membership.factory"
import type { AgentMessage } from "../agents/shared/agent-session-messages/agent-message.entity"
import { agentMessageFactory } from "../agents/shared/agent-session-messages/agent-messages.factory"
import type { ProjectMembership } from "../projects/memberships/project-membership.entity"
import { projectMembershipFactory } from "../projects/memberships/project-membership.factory"
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

type OrganizationParams = {
  organization?: Partial<Organization>
  user?: Partial<User>
  organizationMembership?: Partial<OrganizationMembership>
}

type OrganizationReturnType = {
  organization: Organization
  user: User
  organizationMembership: OrganizationMembership
}
export function buildOrganizationWithOwner(
  params: OrganizationParams = {},
): OrganizationReturnType {
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
  params: OrganizationParams = {},
): Promise<OrganizationReturnType> {
  const { organization, user, organizationMembership } = buildOrganizationWithOwner(params)

  await Promise.all([
    repositories.userRepository.save(user),
    repositories.organizationRepository.save(organization),
  ])
  await repositories.organizationMembershipRepository.save(organizationMembership)

  return { organization, user, organizationMembership }
}

type ProjectParams = OrganizationParams & {
  project?: Partial<Project>
  projectMembership?: Partial<ProjectMembership>
}
type ProjectReturnType = OrganizationReturnType & {
  project: Project
  projectMembership: ProjectMembership
}
export async function createOrganizationWithProject(
  repositories: AllRepositories,
  params: ProjectParams = {},
): Promise<ProjectReturnType> {
  const data = await createOrganizationWithOwner(repositories, params)
  const { organization, user } = data

  const project = projectFactory.transient({ organization }).build(params.project)
  await repositories.projectRepository.save(project)

  const projectMembership = projectMembershipFactory
    .owner()
    .transient({ user, project })
    .build(params.projectMembership)
  await repositories.projectMembershipRepository.save(projectMembership)

  return { ...data, projectMembership, project }
}

type AgentParams = ProjectParams & {
  agent?: Partial<Agent>
  agentMembership?: Partial<AgentMembership>
}
type AgentReturnType = ProjectReturnType & {
  agent: Agent
  agentMembership: AgentMembership
}
export async function createOrganizationWithAgent(
  repositories: AllRepositories,
  params: AgentParams = {},
): Promise<AgentReturnType> {
  const data = await createOrganizationWithProject(repositories, params)
  const { organization, user, project } = data

  const agent = agentFactory.transient({ project, organization }).build(params.agent)
  await repositories.agentRepository.save(agent)
  const agentMembership = agentMembershipFactory
    .owner()
    .transient({ user, agent })
    .build(params.agentMembership)
  await repositories.agentMembershipRepository.save(agentMembership)

  return {
    ...data,
    agent,
    agentMembership,
  }
}

type AgentSessionParams = AgentParams & {
  agentSession?: Partial<ConversationAgentSession>
}
type AgentSessionReturnType = AgentReturnType & {
  agentSession: ConversationAgentSession
}
export async function createOrganizationWithAgentSession(
  repositories: AllRepositories,
  params: AgentSessionParams = {},
): Promise<AgentSessionReturnType> {
  const data = await createOrganizationWithAgent(repositories, params)
  const { organization, user, agent, project } = data

  const agentSession = conversationAgentSessionFactory
    .transient({ organization, project, user, agent })
    .build(params.agentSession)
  await repositories.conversationAgentSessionRepository.save(agentSession)

  return { ...data, agentSession }
}

type AgentMessageParams = AgentSessionParams & {
  agentMessage?: Partial<AgentMessage>
}
type AgentMessageReturnType = AgentSessionReturnType & {
  agentMessage: AgentMessage
}
export async function createOrganizationWithAgentMessage(
  repositories: AllRepositories,
  params: AgentMessageParams = {},
): Promise<AgentMessageReturnType> {
  const data = await createOrganizationWithAgentSession(repositories, params)
  const { organization, project, agentSession } = data

  const agentMessage = agentMessageFactory
    .transient({ organization, project, session: agentSession })
    .build(params.agentMessage)
  await repositories.agentMessageRepository.save(agentMessage)

  return { ...data, agentMessage }
}

type DocumentParams = ProjectParams & {
  document?: Partial<Document>
}
type DocumentReturnType = ProjectReturnType & {
  document: Document
}
export async function createOrganizationWithDocument(
  repositories: AllRepositories,
  params: DocumentParams = {},
): Promise<DocumentReturnType> {
  const data = await createOrganizationWithProject(repositories, params)
  const { organization, project } = data

  const document = documentFactory.transient({ organization, project }).build(params.document)
  await repositories.documentRepository.save(document)

  return { ...data, document }
}
