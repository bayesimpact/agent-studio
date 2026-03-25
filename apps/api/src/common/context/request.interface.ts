import type { Agent } from "@/domains/agents/agent.entity"
import type { ConversationAgentSession } from "@/domains/agents/conversation-agent-sessions/conversation-agent-session.entity"
import type { FormAgentSession } from "@/domains/agents/form-agent-sessions/form-agent-session.entity"
import type { AgentMembership } from "@/domains/agents/memberships/agent-membership.entity"
import type { Document } from "@/domains/documents/document.entity"
import type { DocumentTag } from "@/domains/documents/tags/document-tag.entity"
import type { Evaluation } from "@/domains/evaluations/evaluation.entity"
import type { EvaluationReport } from "@/domains/evaluations/reports/evaluation-report.entity"
import type { OrganizationMembership } from "@/domains/organizations/memberships/organization-membership.entity"
import type { ProjectMembership } from "@/domains/projects/memberships/project-membership.entity"
import type { Project } from "@/domains/projects/project.entity"
import type { User } from "@/domains/users/user.entity"

export interface JwtPayload {
  sub: string
  iss: string
  aud: string[]
  iat: number
  exp: number
  azp: string
  scope: string
}

export interface EndpointRequest {
  jwtPayload: JwtPayload
  user: User
}

export interface EndpointRequestWithOrganizationMembership extends EndpointRequest {
  organizationMembership: OrganizationMembership
  organizationId: string
}

export interface EndpointRequestWithProject extends EndpointRequestWithOrganizationMembership {
  project: Project
  projectMembership: ProjectMembership | undefined
}

export interface EndpointRequestWithProjectMembership extends EndpointRequestWithProject {
  memberProjectMembership: ProjectMembership
}

export interface EndpointRequestWithAgent extends EndpointRequestWithProject {
  agent: Agent
  agentMembership: AgentMembership | undefined
}

export interface EndpointRequestWithAgentMembership extends EndpointRequestWithAgent {
  memberAgentMembership: AgentMembership
}

export interface EndpointRequestWithDocument extends EndpointRequestWithProject {
  document: Document
}

export interface EndpointRequestWithDocumentTag extends EndpointRequestWithProject {
  documentTag: DocumentTag
}

export interface EndpointRequestWithAgentSession extends EndpointRequestWithAgent {
  agentSession: ConversationAgentSession | FormAgentSession
}

export interface EndpointRequestWithEvaluation extends EndpointRequestWithProject {
  evaluation: Evaluation
}

export interface EndpointRequestWithEvaluationReport extends EndpointRequestWithEvaluation {
  evaluationReport: EvaluationReport
}
